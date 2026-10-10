export const agents = Object.freeze({
  investigator: { name: '案件调查 Agent', description: '查询主体、交易、名单与关联关系，给出带证据的调查建议。', tools: ['get_case', 'get_transactions', 'get_watchlist', 'get_relations'] },
  evaluator: { name: '验证报告 Agent', description: '读取真实执行记录，计算工具与证据检查结果，整理验证报告。', tools: ['get_run', 'compute_checks'] },
  analyst: { name: '日志排查 Agent', description: '查询实际运行事件，定位失败、超时、权限或数据问题。', tools: ['get_run', 'get_events'] }
});
export const cases = Object.freeze([
  { id: 'SIM-CASE-001', subjectId: 'SIM-ACCOUNT-001', title: '新设备连续转账', amount: 18600, currency: 'CNY', initialControl: 'held', signal: '10 分钟内 5 笔转账且设备首次出现', dataKind: 'synthetic' },
  { id: 'SIM-CASE-002', subjectId: 'SIM-ACCOUNT-002', title: '历史收款人交易', amount: 1200, currency: 'CNY', initialControl: 'held', signal: '单笔金额超过本地演示阈值', dataKind: 'synthetic' },
  { id: 'SIM-CASE-003', subjectId: 'SIM-ACCOUNT-003', title: '证据缺失分支', amount: 9200, currency: 'CNY', initialControl: 'held', signal: '交易明细来源不可用', dataKind: 'synthetic' }
]);
const transactions = {
  'SIM-CASE-001': [{ id: 'SIM-TX-001', amount: 18000, newDevice: true, newRecipient: true }, { id: 'SIM-TX-002', amount: 18600, newDevice: true, newRecipient: true }],
  'SIM-CASE-002': [{ id: 'SIM-TX-003', amount: 1200, newDevice: false, newRecipient: false }]
};
const descriptions = {
  get_case: '读取本任务模拟案件的不可变初始快照。',
  get_transactions: '读取本任务模拟案件的交易记录。明确报告缺失，不补造。',
  get_watchlist: '查询模拟名单匹配；非真实制裁或合规校验。',
  get_relations: '查询模拟主体与设备关系。',
  get_run: '读取选定历史任务的结果、状态、模型版本与实际调用统计。',
  compute_checks: '计算选定历史任务的执行完整性检查，不证明准确率或生产发布资格。',
  get_events: '读取选定历史任务的实际执行事件。'
};
export function schemas(agentId) {
  return agents[agentId].tools.map(name => ({
    type: 'function',
    function: { name, description: descriptions[name], parameters: { type: 'object', properties: {}, required: [], additionalProperties: false } }
  }));
}
export function executeTool(store, run, name, args) {
  if (!agents[run.agentId].tools.includes(name)) throw new Error('TOOL_NOT_AUTHORIZED');
  if (!args || typeof args !== 'object' || Array.isArray(args) || Object.keys(args).length) throw new Error('INVALID_TOOL_ARGUMENTS');
  if (run.agentId === 'investigator') {
    const item = cases.find(c => c.id === run.targetId);
    if (!item) throw new Error('CASE_NOT_FOUND');
    const base = { sourceId: run.targetId + ':' + name, dataKind: 'synthetic' };
    if (name === 'get_case') return { ...base, snapshot: item };
    if (name === 'get_transactions') return { ...base, missing: !transactions[item.id], records: transactions[item.id] || [] };
    if (name === 'get_watchlist') return { ...base, matches: item.id === 'SIM-CASE-001' ? [{ list: '模拟观察名单', subjectId: item.subjectId }] : [], sanctionsCheck: 'not_performed' };
    if (name === 'get_relations') return { ...base, sharedDeviceAccounts: item.id === 'SIM-CASE-001' ? 4 : 1 };
  }
  const target = store.get(run.targetId);
  if (!target || target.id === run.id) throw new Error('TARGET_RUN_NOT_FOUND');
  const events = store.events(target.id);
  if (name === 'get_run') return { sourceId: target.id, dataKind: 'actual_execution_on_synthetic_data', run: target };
  if (name === 'get_events') return { sourceId: target.id, dataKind: 'actual_execution_on_synthetic_data', events };
  if (name === 'compute_checks') {
    const calls = events.filter(e => e.kind === 'tool_result');
    return {
      sourceId: target.id, dataKind: 'actual_execution_on_synthetic_data',
      checks: { executionSucceeded: target.status === 'succeeded', hasToolEvidence: calls.length > 0, noBlockedToolCalls: !events.some(e => e.kind === 'tool_blocked'), noMissingToolData: !calls.some(e => e.detail.result?.missing) },
      sampleSize: 1, productionReleaseEligible: false,
      limitations: '单次执行完整性检查；不证明样本覆盖、准确率、无基线回退或真实发布资格。'
    };
  }
  throw new Error('UNKNOWN_TOOL');
}
