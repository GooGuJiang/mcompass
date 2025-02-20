import { FC } from "react";
import { SwitchProps, useSwitch } from "@nextui-org/switch";
import { useTheme } from "next-themes";
import { useIsSSR } from "@react-aria/ssr";
import clsx from "clsx";

import { SunFilledIcon, MoonFilledIcon } from "@/components/icons";

export interface ThemeSwitchProps {
  className?: string;
  classNames?: SwitchProps["classNames"];
}

export const ThemeSwitch: FC<ThemeSwitchProps> = ({
  className,
  classNames,
}) => {
  const { theme, setTheme } = useTheme();
  const isSSR = useIsSSR();

  const onChange = () => {
    theme === "light" ? setTheme("dark") : setTheme("light");
  };

  const {
    Component,
    slots,
    isSelected,
    getBaseProps,
    getInputProps,
    getWrapperProps,
  } = useSwitch({
    isSelected: theme === "light" || isSSR,
    "aria-label": `Switch to ${theme === "light" || isSSR ? "dark" : "light"} mode`,
    onChange,
  });

  // 检查 slots 是否有 hiddenInput 函数，并决定是否使用
  const hasHiddenInput = slots.hiddenInput && typeof slots.hiddenInput === "function";

  return (
    <Component
      {...getBaseProps({
        className: clsx(
          "px-px transition-opacity hover:opacity-80 cursor-pointer",
          className,
          classNames?.base,
        ),
      })}
    >
      {/* 如果有 hiddenInput 函数，才执行它 */}
      {hasHiddenInput && <input {...getInputProps()} />}
      {!hasHiddenInput && <div>Input is not available</div>} {/* 或者渲染其他内容 */}
      
      <div
        {...getWrapperProps()}
        className={clsx(
          "w-auto h-auto bg-transparent rounded-lg flex items-center justify-center group-data-[selected=true]:bg-transparent !text-default-500 pt-px px-0 mx-0",
          classNames?.wrapper,
        )}
      >
        {!isSelected || isSSR ? (
          <SunFilledIcon size={22} />
        ) : (
          <MoonFilledIcon size={22} />
        )}
      </div>
    </Component>
  );
};
