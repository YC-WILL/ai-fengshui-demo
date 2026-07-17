"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import SubmitBar from "@/components/forms/SubmitBar";
import DraftNotice from "@/components/forms/DraftNotice";
import PageIntro from "@/components/PageIntro";
import { type FengShuiInput, type ReportType } from "@/lib/types";
import { fetchReport, readReportResponse } from "@/lib/reports/client";
import { useFormDraft } from "@/lib/hooks/useFormDraft";

const ROOM_OPTIONS = ["玄关", "客厅", "餐厅", "卧室", "厨房", "卫生间", "书房", "阳台"];
const ORIENTATIONS = ["朝南", "朝北", "朝东", "朝西", "朝东南", "朝西南", "朝东北", "朝西北"];

export default function FengShuiPage() {
  const router = useRouter();
  const [input, setInput, clearDraft, hasDraft] = useFormDraft<FengShuiInput>("guaan:draft:fengshui", {
    orientation: "朝南",
    layout: "",
    rooms: [{ name: "客厅" }, { name: "卧室" }],
    primaryConcerns: ""
  });
  const [loading, setLoading] = useState<"basic" | "deep" | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function go(reportType: ReportType, tier: "basic" | "deep") {
    setErr(null);
    if (!input.orientation || input.rooms.length === 0) {
      setErr("请填写朝向并至少添加一个房间"); return;
    }
    setLoading(tier);
    try {
      const r = await fetchReport("/api/reports/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reportType, tier, input })
      });
      const j = await readReportResponse(r);
      if (!r.ok || !j.ok || !j.data?.reportId) throw new Error(j.error ?? "生成失败");
      router.push(`/reports/${j.data.reportId}`);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "生成失败");
      setLoading(null);
    }
  }

  function toggleRoom(name: string) {
    setInput(s => {
      const has = s.rooms.find(r => r.name === name);
      return {
        ...s,
        rooms: has
          ? s.rooms.filter(r => r.name !== name)
          : [...s.rooms, { name }]
      };
    });
  }

  function setRoomNote(name: string, note: string) {
    setInput(s => ({
      ...s,
      rooms: s.rooms.map(r => r.name === name ? { ...r, note } : r)
    }));
  }

  return (
    <div className="space-y-6">
      <PageIntro
        title="一起看看这个家"
        subtitle="从门口慢慢走进每个房间，看看光线、空气和日常动线，也聊聊怎样让家住得更舒服。深度版会再陪你细看调整顺序和不同预算的做法。"
        avoid={["发财布局", "转运布局", "化煞保证有效", "玄学治病"]}
      />

      <section className="card space-y-3">
        <DraftNotice hasDraft={hasDraft} onClear={clearDraft} />
        <div>
          <label className="field-label">房屋主朝向</label>
          <select
            className="field-input"
            value={input.orientation}
            onChange={e => setInput(s => ({ ...s, orientation: e.target.value }))}
          >
            {ORIENTATIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>

        <div>
          <label className="field-label">户型描述（文字）</label>
          <textarea
            className="field-input min-h-[80px]"
            value={input.layout}
            onChange={e => setInput(s => ({ ...s, layout: e.target.value }))}
            placeholder="例：两室一厅一卫，建筑面积 78㎡，南北通透，入户门正对客厅落地窗"
          />
          <div className="field-help">MVP 阶段为文字输入，后续将支持上传户型图。</div>
        </div>

        <div>
          <label className="field-label">想分析的空间</label>
          <div className="flex flex-wrap gap-2">
            {ROOM_OPTIONS.map(r => {
              const active = !!input.rooms.find(x => x.name === r);
              return (
                <button
                  type="button"
                  key={r}
                  onClick={() => toggleRoom(r)}
                  className={`px-3 py-1 rounded-full border text-sm transition ${
                    active ? "bg-cinnabar text-white border-cinnabar" : "bg-white border-mist hover:border-ink/30"
                  }`}
                >
                  {r}
                </button>
              );
            })}
          </div>
          <div className="mt-3 space-y-2">
            {input.rooms.map(r => (
              <div key={r.name} className="grid grid-cols-[80px_1fr] gap-2 items-center">
                <span className="text-sm text-ink/70">{r.name}</span>
                <input
                  className="field-input"
                  placeholder={`关于${r.name}的具体情况（可选）`}
                  value={r.note ?? ""}
                  onChange={e => setRoomNote(r.name, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="field-label">你在这个家里最困扰的事（可选）</label>
          <textarea
            className="field-input min-h-[60px]"
            value={input.primaryConcerns}
            onChange={e => setInput(s => ({ ...s, primaryConcerns: e.target.value }))}
            placeholder="可以写具体感受和场景：晚上临街太吵、客厅西晒让人烦躁、回家总觉得东西没地方放。"
          />
          <div className="field-help">写得越具体，建议越会围绕你的实际困境，而不是套用整屋清单。</div>
        </div>

        <SubmitBar
          loading={loading}
          error={err}
          onBasic={() => go("home_fengshui_basic", "basic")}
          onDeep={() => go("home_fengshui_deep", "deep")}
          deepLabel="把这个家细细走一遍"
        />
      </section>
    </div>
  );
}
