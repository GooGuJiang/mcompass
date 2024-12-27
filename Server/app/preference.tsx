'use client';
import { Tab, Tabs } from "@nextui-org/tabs";
import { Card } from "@nextui-org/card";
import WiFiPanel from "./wifi";
import SpawnPanel from "./spwan";
import InfoPanel from "./info";
import ColorsPanel from "./colors";
import { useState } from "react";
import { FaPalette ,FaWifi ,FaLocationDot ,FaCircleInfo  } from "react-icons/fa6";

// 定义 Tab 的 key 类型
type TabKey = "colors" | "wifi" | "spawn" | "info";

const DEFAULT_ACTIVE_TAB: TabKey = "colors";

// TabKey 到颜色的映射表
const colorMap: Record<TabKey, "default" | "primary" | "secondary" | "success" | "warning" | "danger" | undefined> = {
    colors: "default",
    wifi: "success",
    spawn: "primary",
    info: "danger",
};


interface TabContentProps {
    activeTab: TabKey;
}

interface TabSelectorProps {
    activeTab: TabKey;
    setActiveTab: (key: TabKey) => void;
}

function TabSelector({ activeTab, setActiveTab }: TabSelectorProps) {
    return (
        <div
            style={{
                zIndex: 9999,
                position: "absolute", // 或者 "fixed" 根据需求
                top: "91%", // 调整位置
                left: "47.3%",
                transform: "translateX(-50%)", // 居中对齐
                width: "300px", // 固定宽度，避免干扰其他元素
            }}
        >
            <Tabs
                aria-label="Options"
                color={colorMap[activeTab]}
                onSelectionChange={(key) => setActiveTab(key as TabKey)}
            >
                <Tab key="colors" title={
                    <div className="flex items-center">
                        <FaPalette className="mr-2" />
                        颜色
                    </div>
                } />
                <Tab key="wifi" title={
                    <div className="flex items-center">
                        <FaWifi className="mr-2" />
                        WiFi
                    </div>
                } />
                <Tab key="spawn" title={
                    <div className="flex items-center">
                        <FaLocationDot className="mr-2" />
                        出生点
                    </div>
                } />
                <Tab key="info" title={
                    <div className="flex items-center">
                        <FaCircleInfo className="mr-2" />
                        固件信息
                    </div>
                } />
            </Tabs>
        </div>
    );
}


function TabContent({ activeTab }: TabContentProps) {
    return (
        <div className="flex flex-col items-center justify-center h-full">
            {(() => {
                switch (activeTab) {
                    case "colors":
                        return <ColorsPanel />;
                    case "wifi":
                        return <WiFiPanel />;
                    case "spawn":
                        return <SpawnPanel />;
                    case "info":
                        return <InfoPanel />;
                    default:
                        return null;
                }
            })()}
        </div>
    );
}

export default function Preference() {
    const [activeTab, setActiveTab] = useState<TabKey>(DEFAULT_ACTIVE_TAB);

    return (
        <div className="flex flex-col -mt-16 w-full" style={{ height: "calc(100vh - 190px)" }}>
            <Card className="w-full max-w-8xl mx-auto h-full">
                <div className="w-72 m-auto">
                    <TabContent activeTab={activeTab} />
                </div>
            </Card>

            <TabSelector activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>
    );
}
