import { brand } from "@/lib/config/brand";

export const metadata = { title: `AI 内容免责声明 · ${brand.brandFullName}` };

export default function DisclaimerPage() {
  return (
    <article className="prose-report card max-w-none">
      <h1>AI 内容免责声明</h1>

      <p>
        本服务所有报告内容均由人工智能模型自动生成。请您在阅读与使用前充分理解以下事项：
      </p>

      <h2>1. 内容性质</h2>
      <p>
        所有报告内容基于<strong>传统历法、民俗文化、空间环境建议与心理学框架</strong>生成，
        <strong>仅供文化参考、娱乐参考与生活规划启发</strong>。
      </p>

      <h2>2. 我们不做的事</h2>
      <ul>
        <li>不预测命运、寿命、生死、疾病、灾祸、彩票、股票收益。</li>
        <li>不承诺改运、消灾、化煞、开光、保平安等任何"玄学功效"。</li>
        <li>不对婚姻、感情存续作出绝对判断（"必合 / 必分 / 必出轨"等）。</li>
        <li>不替代医疗诊断、法律建议、投资建议、心理治疗等专业服务。</li>
      </ul>

      <h2>3. 我们做的事</h2>
      <ul>
        <li>结合传统视角与现实生活逻辑，提供可执行的<strong>生活规划与空间整理建议</strong>。</li>
        <li>以"沟通、节奏、边界"为核心，给出关系相处的<strong>参考性</strong>视角。</li>
        <li>对所有可能产生绝对化判断的内容进行安全过滤与重写。</li>
      </ul>

      <h2>4. 重要提醒</h2>
      <p>
        AI 生成内容存在偏差与不确定性，请<strong>不要将本报告作为重大人生决策的唯一依据</strong>。
        涉及健康、法律、财务、婚姻等重要事项，请<strong>务必咨询相应的专业人士</strong>。
      </p>

      <h2>5. 反馈与改进</h2>
      <p>
        如您发现报告中存在不当内容（恐吓、绝对化承诺、医疗诊断、投资引导等），
        请通过"我的"页面反馈，我们会持续完善内容安全规则。
      </p>
    </article>
  );
}
