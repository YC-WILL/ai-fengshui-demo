import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const privacy = readFileSync("src/app/legal/privacy/page.tsx", "utf8");
const terms = readFileSync("src/app/legal/terms/page.tsx", "utf8");
const meActions = readFileSync("src/app/me/MeActions.tsx", "utf8");
const drawer = readFileSync("src/app/me/AccountDrawer.tsx", "utf8");
const combinedUi = [privacy, terms, meActions, drawer].join("\n");

describe("identity and privacy copy", () => {
  it("states the same-browser anonymous identity and unverified email boundary", () => {
    expect(privacy).toContain("匿名身份 Cookie");
    expect(privacy).toContain("清除 Cookie、更换浏览器或更换设备");
    expect(privacy).toContain("邮箱目前未经验证，不是登录凭证");
    expect(terms).toContain("不提供登录、邮箱验证、账户找回、跨设备恢复或数据合并");
    expect(meActions).toContain("不能用于找回、跨设备恢复或合并数据");
  });

  it("explains explicit snapshot saving and saved structured fields", () => {
    expect(privacy).toContain("点击“保存这次查看”");
    expect(privacy).toContain("仅在页面上计算、查看或修改输入，不等于保存四盘快照");
    for (const phrase of ["规范化输入", "结构化结果", "协议版本", "计算引擎版本", "计算时间"]) {
      expect(privacy).toContain(phrase);
    }
    expect(combinedUi).not.toContain("自动归档");
    expect(combinedUi).not.toContain("云端同步");
  });

  it("covers third-party birthday minimization and nickname semantics", () => {
    expect(privacy).toContain("另一人的出生日期和可选昵称");
    expect(privacy).toContain("昵称只用于帮助您辨认记录，不参与关系计算");
    expect(privacy).toContain("仅在具有合理依据时输入");
    expect(privacy).toContain("尽量减少不必要的第三方个人信息");
    expect(terms).toContain("关系盘可能涉及另一人的出生日期和可选昵称");
  });

  it("separates deterministic plate calculation from other features", () => {
    expect(privacy).toContain("当前四盘结构化输入与结果使用站内确定性规则计算");
    expect(privacy).toContain("保存四盘快照、行动和复盘时不调用外部 AI");
    expect(privacy).toContain("不表示全站所有功能都不使用模型服务");
  });

  it("states single-record and account deletion effects accurately", () => {
    expect(privacy).toContain("删除单条四盘记录时，该快照下的行动与复盘会一并删除");
    expect(privacy).toContain("删除单条四盘记录不会删除本人的生辰资料");
    expect(privacy).toContain("删除账户会删除当前匿名身份下");
    expect(privacy).toContain("删除操作无法在页面中恢复");
    expect(privacy).toContain("系统会建立新的匿名身份，不会恢复或合并已删除身份");
  });

  it("contains no positive login, recovery, sync, or automatic-save promise", () => {
    expect(combinedUi).not.toMatch(/已经登录|已登录|可用邮箱找回|支持跨设备恢复|已同步到云端|系统会自动保存/);
  });
});
