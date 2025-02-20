#include <FastLED.h>
#include <OneButton.h>
#include <Preferences.h>
#include <QMC5883LCompass.h>
#include <TinyGPSPlus.h>
#include <esp_log.h>
#include <esp_task_wdt.h>

#include "func.h"
#include "macro_def.h"

extern CRGB leds[NUM_LEDS];
extern QMC5883LCompass compass;
TinyGPSPlus gps;
HardwareSerial GPSSerial(0);
OneButton button(CALIBRATE_PIN, true);

// 目标位置
Location targetLoc = {.latitude = 43.0f, .longitude = 126.0f};

// 当前位置
Location currentLoc = {.latitude = 1000.0f, .longitude = 1000.0f};

// 状态
CompassState deviceState = CompassState::STATE_LOST_BEARING;
CompassState lastDeviceState = CompassState::STATE_LOST_BEARING;
// 工作模式模式
CompassType deviceType = CompassType::LocationCompass;
// 用来显示特定动画的帧索引
uint8_t animationFrameIndex = 0;
// GPS休眠时间
uint32_t gpsSleepInterval = 60 * 60; // 单位:秒

// GPS休眠配置表
const SleepConfig sleepConfigs[] = {
    {10.0f, 0, true},         // 在10KM距离内，不休眠
    {50.0f, 5 * 60, false},   // 超过50KM，休眠5分钟
    {100.0f, 10 * 60, false}, // 超过100KM，休眠10分钟
    {200.0f, 15 * 60, false}, // 超过200KM，休眠15分钟
};

void setup() {
  // 延时,用于一些特殊情况下能够重新烧录
  delay(800);
  // 配置校准引脚状态
  pinMode(CALIBRATE_PIN, INPUT_PULLUP);
  pinMode(GPS_EN_PIN, OUTPUT);
  digitalWrite(GPS_EN_PIN, HIGH);
  FastLED.addLeds<NEOPIXEL, DATA_PIN>(leds, NUM_LEDS);
  FastLED.setBrightness(128);
  long t = millis();
  Serial.begin(115200);
  while (millis() - t < 2500) {
    showFrame(animationFrameIndex);
    animationFrameIndex++;
    if (animationFrameIndex > MAX_FRAME_INDEX) {
      animationFrameIndex = 0;
    }
    delay(30);
  }

  // 配置GPS串口
  GPSSerial.begin(9600, SERIAL_8N1, RX, TX);
  // 创建显示任务
  xTaskCreate(displayTask, "displayTask", 4096, NULL, 2, NULL);
  // 创建位置任务
  xTaskCreate(locationTask, "locationTask", 4096, NULL, 2, NULL);
  xTaskCreate(buttonTask, "buttonTask", 4096, NULL, 2, NULL);

  // 获取目标位置
  getHomeLocation(targetLoc);
  Serial.print("targetLoc.latitude:");
  Serial.print(targetLoc.latitude);
  Serial.print(",targetLoc.latitude:");
  Serial.print(targetLoc.longitude);
  Serial.println();
  // 初始化罗盘
  compass.init();
  // 校准引脚被按下时候进行校准
  if (digitalRead(CALIBRATE_PIN) == LOW) {
    calibrateCompass();
  }
  // 结束校准阶段, 开启GPS, 等待GPS信号
  digitalWrite(GPS_EN_PIN, LOW);
  deviceState = STATE_WAIT_GPS;
  button.attachClick(
      [](void *scope) {
        switch (deviceState) {
        case CompassState::STATE_COMPASS: {
          if (deviceType == CompassType::LocationCompass) {
            deviceType = CompassType::NorthCompass;
          } else {
            deviceType = CompassType::LocationCompass;
          }
          Serial.print("Toggle Compass Type to ");
          Serial.println(deviceType == CompassType::LocationCompass
                             ? "LocationCompass"
                             : "NorthCompass");
          break;
        }

        default:
          break;
        }
      },
      &button);
  button.attachLongPressStart(
      [](void *scope) {
        switch (deviceState) {
        case CompassState::STATE_COMPASS: {
          // 设置当前地点为Home
          // 检查GPS状态
          if (currentLoc.latitude < 500.0f) {
            saveHomeLocation(currentLoc);
            targetLoc.latitude = currentLoc.latitude;
            targetLoc.longitude = currentLoc.longitude;
            Serial.println("Set Home");
          } else {
            Serial.println("Can't set home");
          }
          break;
        }
        case CompassState::STATE_CONNECT_WIFI: {
          Serial.println("Clear WiFi");
          // 清空WiFi配置
          Preferences preferences;
          preferences.begin("wifi", false);
          preferences.putString("ssid", "");
          preferences.putString("password", "");
          preferences.end();
          delay(3000);
          esp_restart();
        }

        default:
          break;
        }
      },
      &button);
  deviceState = STATE_COMPASS;
  // 插入电脑情况下会启动服务器;
  setupServer();
}

void loop() { delay(1000); }

void displayTask(void *pvParameters) {
  while (1) {
    switch (deviceState) {
    case STATE_LOST_BEARING:
    case STATE_WAIT_GPS: {
      // 等待GPS数据
      theNether();
      delay(50);
      continue;
    }
    case STATE_COMPASS: {
      compass.read();
      float azimuth = compass.getAzimuth();
      if (azimuth < 0) {
        azimuth += 360;
      }
      if (deviceType == CompassType::LocationCompass) {
        // 检测当前坐标是否合法
        if (currentLoc.latitude < 200.0f) {
          showFrameByLocation(targetLoc.latitude, targetLoc.longitude,
                              currentLoc.latitude, currentLoc.longitude,
                              azimuth);
        } else {
          theNether();
          delay(50);
          continue;
        }
      } else {
#if DEBUG_DISPLAY
        Serial.printf("Azimuth = %d\n", azimuth);
#endif
        showFrameByAzimuth(360 - azimuth);
      }
      delay(50);
      break;
    }
    case STATE_CONNECT_WIFI:
      showFrame(animationFrameIndex, CRGB::Green);
      animationFrameIndex++;
      if (animationFrameIndex > MAX_FRAME_INDEX) {
        animationFrameIndex = 0;
      }
      delay(30);
      break;
    case STATE_SERVER_COLORS: {
      // showServerColors();
      delay(50);
      break;
    }
    case STATE_SERVER_WIFI: {
      showServerWifi();
      break;
    }
    case STATE_SERVER_SPAWN: {
      showServerSpawn();
      break;
    }
    case STATE_SERVER_INFO: {
      showServerInfo();
      break;
    }
    case STATE_HOTSPOT: {
      showFrame(animationFrameIndex, CRGB::Yellow);
      animationFrameIndex++;
      if (animationFrameIndex > MAX_FRAME_INDEX) {
        animationFrameIndex = 0;
      }
      delay(30);
      break;
    }
    default:
      delay(50);
      break;
    }
  }
}

/**
 * @brief 位置任务
 *
 */
void locationTask(void *pvParameters) {
  // esp_task_wdt_init(30, false);
  while (1) {
    while (GPSSerial.available() > 0) {
      char t = GPSSerial.read();
#if DEBUG_DISPLAY
      Serial.print(t);
#endif
      if (gps.encode(t)) {
#if DEBUG_DISPLAY
        Serial.print("Location: ");
#endif
        if (gps.location.isValid()) {
#if DEBUG_DISPLAY
          Serial.print(gps.location.lat(), 6);
          Serial.print(",");
          Serial.print(gps.location.lng(), 6);
#endif
          // 坐标有效情况下更新本地坐标
          currentLoc.latitude = static_cast<float>(gps.location.lat());
          currentLoc.longitude = static_cast<float>(gps.location.lng());
          // 计算两地距离
          double distance =
              complexDistance(currentLoc.latitude, currentLoc.longitude,
                              targetLoc.latitude, targetLoc.longitude);
          Serial.printf("%f km to target.\n", distance);
          // 获取最接近的临界值
          float threshholdDistance = 0;
          size_t sleepConfigSize = sizeof(sleepConfigs) / sizeof(SleepConfig);
          for (int i = sleepConfigSize - 1; i >= 0; i--) {
            if (distance >= sleepConfigs[i].distanceThreshold) {
              threshholdDistance = sleepConfigs[i].distanceThreshold;
              Serial.printf("use threshold %f km.\n", threshholdDistance);
              break;
            }
          }
          float modDistance = fmod(distance, threshholdDistance);
          // 根据距离调整GPS休眠时间,
          for (int i = 0; i < sleepConfigSize; i++) {
            if (modDistance <= sleepConfigs[i].distanceThreshold) {
              gpsSleepInterval = sleepConfigs[i].sleepInterval;
              if (sleepConfigs[i].gpsEnable) {
                digitalWrite(GPS_EN_PIN, LOW);
              } else {
                digitalWrite(GPS_EN_PIN, HIGH);
              }
              Serial.printf("GPS Sleep %d seconds\n", gpsSleepInterval);
              break;
            }
          }
        }
      } else {
#if DEBUG_DISPLAY
        Serial.print("INVALID");
#endif
      }

#if DEBUG_DISPLAY
      Serial.print("  Date/Time: ");
      if (gps.date.isValid()) {
        Serial.print(gps.date.month());
        Serial.print("/");
        Serial.print(gps.date.day());
        Serial.print("/");
        Serial.print(gps.date.year());
      } else {
        Serial.print("INVALID");
      }

      Serial.print(" ");
      if (gps.time.isValid()) {
        if (gps.time.hour() < 10)
          Serial.print("0");
        Serial.print(gps.time.hour());
        Serial.print(":");
        if (gps.time.minute() < 10)
          Serial.print("0");
        Serial.print(gps.time.minute());
        Serial.print(":");
        if (gps.time.second() < 10)
          Serial.print("0");
        Serial.print(gps.time.second());
        Serial.print(".");
        if (gps.time.centisecond() < 10)
          Serial.print("0");
        Serial.print(gps.time.centisecond());
      } else {
        Serial.print("INVALID");
      }
      Serial.println();
#endif
      // Serial.println("available()");
    }
    if (gpsSleepInterval == 0) {
      digitalWrite(GPS_EN_PIN, LOW);
      gpsSleepInterval = 60 * 60;
    } else {
      gpsSleepInterval--;
    }
    // esp_task_wdt_reset(); // 定期喂狗
    delay(1000);
  }
}

void buttonTask(void *pvParameters) {
  while (1) {
    button.tick();
    delay(10);
  }
}