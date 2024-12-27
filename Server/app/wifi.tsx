'use client';
import { Button } from "@nextui-org/button";
import { Input } from "@nextui-org/input";
import { useEffect, useState } from "react";

export default function WiFiPanel() {
    const [ssid, setSSID] = useState("");
    const [password, setPassword] = useState("");


    useEffect(() => {
        fetch("/wifi")
            .then(response => response.json())
            .then(data => {
                if (data.ssid && data.password) {
                    setSSID(data.ssid);
                    setPassword(data.password);
                }
            });
    }, []);

    function handlePasswordChange(e: any) {
        setPassword(e.target.value);
    }

    function handleSSIDChange(e: any) {
        console.log("SSID changed ", e.target.value);
        setSSID(e.target.value);
    }

    function saveWiFi() {
        fetch(`/setWiFi?ssid=${encodeURIComponent(ssid)}&password=${encodeURIComponent(password)}`, {
            method: "POST"
        });
    }

    return (
        <div className="flex flex-col items-center justify-center flex-wrap gap-4">
            <p className="px-3 text-start w-full">
            保存WiFi可能导致设备重启，<span className="block">并丢失当前连接。</span>
            <span className="block">如果无法连接到新的WiFi，</span>
            <span className="block">设备将使用旧的WiFi。</span>
            </p>
            <Input
                type="text"
                label="WIFI名称"
                value={ssid}
                onChange={handleSSIDChange}
            />
            <Input
                type="text"
                label="WIFI密码"
                value={password}
                onChange={handlePasswordChange}
            />
            <Button color="primary" variant="ghost" className="max-w-xs" onClick={saveWiFi}>
                保存
            </Button>
        </div>
    );
}