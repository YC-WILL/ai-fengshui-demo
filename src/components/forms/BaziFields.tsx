"use client";

import type { BaziInput, Gender } from "@/lib/types";
import type { Dispatch, SetStateAction } from "react";

export default function BaziFields({
  value, onChange, prefix = ""
}: {
  value: BaziInput;
  /**
   * 接受 React 的函数式更新，避免日期、时间和“不知道”复选框快速
   * 连续操作时，闭包里的旧 value 把刚填写的出生日期覆盖掉。
   */
  onChange: Dispatch<SetStateAction<BaziInput>>;
  prefix?: string;
}) {
  const set = (patch: Partial<BaziInput>) => onChange(previous => ({ ...previous, ...patch }));
  const id = (k: string) => `${prefix}${k}`;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div>
        <label className="field-label" htmlFor={id("gender")}>性别</label>
        <select
          id={id("gender")}
          className="field-input"
          value={value.gender}
          onChange={e => set({ gender: e.target.value as Gender })}
        >
          <option value="male">男</option>
          <option value="female">女</option>
          <option value="other">不愿透露</option>
        </select>
      </div>
      <div>
        <label className="field-label" htmlFor={id("birthDate")}>出生日期（公历）</label>
        <input
          id={id("birthDate")}
          type="date"
          className="field-input"
          value={value.birthDate}
          onChange={e => set({ birthDate: e.target.value })}
        />
      </div>
      <div>
        <label className="field-label" htmlFor={id("birthTime")}>出生时间</label>
        <div className="flex items-center gap-2">
          <input
            id={id("birthTime")}
            type="time"
            className="field-input"
            value={value.birthTime ?? ""}
            disabled={value.unknownTime}
            onChange={e => set({ birthTime: e.target.value })}
          />
          <label className="text-xs text-ink/70 whitespace-nowrap flex items-center gap-1">
            <input
              type="checkbox"
              checked={!!value.unknownTime}
              onChange={e => onChange(previous => ({
                ...previous,
                unknownTime: e.target.checked,
                // 只改出生时间相关字段；使用最新 state，避免快速操作覆盖生日。
                birthTime: e.target.checked ? "" : previous.birthTime
              }))}
            />
            不知道
          </label>
        </div>
        <div className="field-help">未知时则省略时柱，相关结论仅参考</div>
      </div>
      <div>
        <label className="field-label" htmlFor={id("birthLocation")}>出生地（可选）</label>
        <input
          id={id("birthLocation")}
          type="text"
          className="field-input"
          value={value.birthLocation ?? ""}
          onChange={e => set({ birthLocation: e.target.value })}
          placeholder="如：浙江杭州（填写城市即可，不必写详细地址）"
        />
      </div>
    </div>
  );
}

export const EMPTY_BAZI: BaziInput = {
  gender: "other",
  birthDate: "",
  birthTime: "",
  unknownTime: false
};
