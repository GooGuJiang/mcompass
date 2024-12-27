import { useEffect, useState } from "react";

export default function InfoPanel() {

    const [deviceInfo, setDeviceInfo] = useState({
        buildDate: "",
        buildTime: "",
        buildVersion: "",
        gitBranch: "",
        gitCommit: "",
    });

    
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}年${month}月${day}日`;
    };

    useEffect(() => {
        fetch("/info")
            .then(response => response.json())
            .then(data => {
                if (data) {
                    // 格式化日期
                    const formattedDate = formatDate(data.buildDate);
                    setDeviceInfo({ ...data, buildDate: formattedDate });
                }
            });
    }, []);

    return <div>
        <ul>
            <li>版本: {deviceInfo.buildVersion}</li>
            <li>分支: {deviceInfo.gitBranch}</li>
            <li>提交: {deviceInfo.gitCommit}</li>
            <li>构建时间: {deviceInfo.buildTime}</li>
            <li>构建日期: {deviceInfo.buildDate}</li>
        </ul>
    </div>;
}