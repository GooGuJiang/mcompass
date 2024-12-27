'use client';
import { Tab, Tabs } from "@nextui-org/tabs";
import { Card } from "@nextui-org/card";
import WiFiPanel from "./wifi";
import SpawnPanel from "./spwan";
import InfoPanel from "./info";
import ColorsPanel from "./colors";
import { useState } from "react";

export default function Preference() {

    const [color, setColor] = useState("default");

    return <div className="flex flex-col -mt-16 w-full" style={{ height: "calc(100vh - 190px)" }}>
        <Card className="w-full max-w-8xl mx-auto h-full">
            <div className="w-72 mx-auto">
            <Tabs
                aria-label="Options"
                color={color as any}
                onSelectionChange={(key) => {
                    if (key === "colors") setColor("default"); // default
                    if (key === "wifi") setColor("success"); // green
                    if (key === "spawn") setColor("primary"); // blue
                    if (key === "info") setColor("danger"); // red
                }}
            >
                <Tab key="colors" title="颜色">
                    <ColorsPanel />
                </Tab>
                <Tab key="wifi" title="WiFi">
                    <WiFiPanel />
                </Tab>
                <Tab key="spawn" title="出生点">
                    <SpawnPanel />
                </Tab>
                <Tab key="info" title="固件信息">
                    <InfoPanel />
                </Tab>
            </Tabs>
            </div>
        </Card>
    </div>;
}
