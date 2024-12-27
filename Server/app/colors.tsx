import { Button } from "@nextui-org/button";
import { useEffect, useState } from "react";
import { HexColorPicker } from "react-colorful";
import { Input } from "@nextui-org/input";

function useDebounce(value: string, delay: number) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
}

export default function ColorsPanel() {
    const [color, setColor] = useState("#aabbcc");
    const [inputValue, setInputValue] = useState("aabbcc");
    const [isValidColor, setIsValidColor] = useState(true);

    const debounceTimeout = 200; // 200ms debounce
    const debouncedColor = useDebounce(color, debounceTimeout);

    useEffect(() => {
        console.log("Debounced:", debouncedColor);
        fetch(`/setColor?color=${encodeURIComponent(debouncedColor)}`, {
            method: "POST",
        });
    }, [debouncedColor]);

    function validateColor(value: string) {
        const hexColorRegex = /^([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;
        return hexColorRegex.test(value);
    }

    function handleColorPickerChange(newColor: string) {
        const strippedColor = newColor.replace("#", "");
        setInputValue(strippedColor);
        if (validateColor(strippedColor)) {
            setColor(`#${strippedColor}`);
            setIsValidColor(true);
        } else {
            setIsValidColor(false);
        }
    }

    function handleColorInputChange(e: React.ChangeEvent<HTMLInputElement>) {
        const value = e.target.value.replace("#", "");
        setInputValue(value);
        if (validateColor(value)) {
            setColor(`#${value}`);
            setIsValidColor(true);
        } else {
            setIsValidColor(false);
        }
    }

    function handleConfirm() {
        if (!isValidColor) {
            alert("请输入合法的 HEX 颜色值，例如 aabbcc 或 abc");
        }
    }

    return (
        <div className="w-full flex flex-col items-center justify-center flex-wrap gap-4">
            {/* <p>当前颜色: {color}</p> */}
            
            <HexColorPicker color={color} onChange={handleColorPickerChange} />
            
            <Input
                label="输入颜色"
                labelPlacement="outside"
                value={inputValue}
                onChange={handleColorInputChange}
                placeholder="请输入HEX颜色值"
                isInvalid={!isValidColor}
                startContent={
                    <div className="pointer-events-none flex items-center">
                        <span className="text-default-400 text-small">#</span>
                    </div>
                }
            />
            
            <Button onPress={handleConfirm} disabled={!isValidColor}>
                确认颜色
            </Button>
        </div>
    );
}
