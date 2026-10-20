'use strict';

const assert = require('node:assert/strict');
const {test} = require('node:test');
const E = require('./engine.js');
const plan = overrides => E.plan({pay:'100', total:'1538', discount:'7.35', ...overrides});
const equal = (actual, expected, message) => assert.equal(E.cmp(actual, expected), 0, message);
const theory = (P, p) => E.settle(P, E.mul(P, p.q), p);
const videoTask = {res:'480p', ratio:'1:1', seconds:'4', video:true, vin:'2'};

test('7.35 折 covers procurement before rounding and preserves the recharge value', () => {
  const p = plan();
  equal(p.M, '1.538');
  equal(p.breakEvenM, '1.538');
  equal(p.U, E.div('100', '1538'));
  equal(p.targetMarginPct, '0');
  const x = theory('100', p);
  equal(x.C, '73.5');
  equal(x.rawCash, x.C);
  equal(x.unroundedCashProfit, '0');
  assert.ok(E.cmp(x.cashProfit, '0') >= 0);
  assert.ok(E.cmp(x.roundGap, x.roundingUpBound) < 0);
  equal(x.cashProfit, x.profit);
  equal(x.salesMarginPct, x.margin);
});

test('both recorded procurement amounts reproduce the original point calculations', () => {
  const examples = [
    {P:'37.520955', C:'27.577902', raw:'424.14813276', N:'425'},
    {P:'45.550532', C:'33.479641', raw:'514.91687858', N:'515'},
  ];
  for (const example of examples) {
    const original = {P:example.P, C:example.C, N:''};
    const snapshot = structuredClone(original);
    const actual = E.recalcRecord(original, plan());
    equal(actual.raw, example.raw);
    equal(actual.N, example.N);
    equal(actual.C, example.C);
    assert.equal(actual.recordedN, '');
    assert.deepEqual(original, snapshot, 'recalculation must not rewrite original records');
  }
});

test('8 折 is 8.125% target sales margin, distinct from cost markup', () => {
  const p = plan({discount:'8'});
  equal(p.M, E.div('1230.4', '735'));
  equal(p.targetMarginPct, '8.125');
  const x = theory('100', p);
  equal(x.target, '80');
  equal(x.rawCash, '80');
  equal(x.targetCashProfit, '6.5');
  equal(x.raw, '1230.4');
  equal(x.N, '1231');
  equal(x.costMarkupPct, E.mul(E.div(x.cashProfit, '73.5'), '100'));
  assert.ok(E.cmp(x.costMarkupPct, x.salesMarginPct) > 0);
  assert.ok(E.cmp(x.salesMarginPct, '8.125') >= 0);
});

test('margin mode inverts the sales-margin denominator and may exceed list price', () => {
  const p = plan({targetMode:'margin', margin:'8.125'});
  equal(p.M, plan({discount:'8'}).M);
  equal(p.d, '0.8');
  const differentActualCost = E.settle('100', '70', p);
  equal(differentActualCost.target, E.div('70', '0.91875'));
  equal(differentActualCost.rawCash, differentActualCost.target);
  equal(differentActualCost.costGap, '0');
  equal(E.mul(E.div(differentActualCost.unroundedCashProfit, differentActualCost.rawCash), '100'), '8.125');

  const aboveList = plan({targetMode:'margin', margin:'30'});
  equal(aboveList.d, '1.05');
  equal(theory('100', aboveList).target, '105');
  assert.throws(() => plan({targetMode:'margin', margin:'100'}), /小于100/);
  assert.throws(() => plan({targetMode:'margin', margin:'-1'}), /大于等于0/);
  equal(plan({discount:'100'}).d, '10');
  assert.throws(() => plan({discount:'100.01'}), /100折/);
  assert.throws(() => plan({q:'0'}), /采购规则/);
  assert.throws(() => plan({k:'100'}), /常数须为10/);
});

test('procurement and recharge changes obey the selected pricing objective', () => {
  const discountA = plan({discount:'8', q:'0.735'});
  const discountB = plan({discount:'8', q:'0.7'});
  equal(theory('100', discountA).rawCash, theory('100', discountB).rawCash);
  assert.notEqual(E.cmp(discountA.M, discountB.M), 0);

  const marginA = plan({targetMode:'margin', margin:'20', q:'0.735'});
  const marginB = plan({targetMode:'margin', margin:'20', q:'0.7'});
  equal(marginA.M, marginB.M);
  equal(marginA.M, '1.9225');
  equal(marginA.d, '0.91875');
  equal(marginB.d, '0.875');
  const bonusChanged = plan({discount:'8', total:'2000'});
  equal(theory('100', bonusChanged).rawCash, theory('100', discountA).rawCash);
  equal(bonusChanged.U, '0.05');
});

test('saved multiplier precision can cross an exact integer point boundary', () => {
  const ideal = plan();
  const nearest = plan({appliedM:E.decimalString(ideal.M, 2, 'nearest')});
  const truncated = plan({appliedM:E.decimalString(ideal.M, 2, 'truncate')});
  equal(nearest.usedM, '1.54');
  equal(truncated.usedM, '1.53');
  const boundaryP = E.div('1', E.mul('0.735', '15.38'));
  const a = theory(boundaryP, ideal);
  const b = theory(boundaryP, nearest);
  const c = theory(boundaryP, truncated);
  equal(a.raw, '1');
  equal(a.N, '1');
  equal(a.roundGap, '0');
  equal(b.N, '2');
  equal(c.N, '1');
  assert.ok(E.cmp(b.precisionGap, '0') > 0);
  assert.ok(E.cmp(c.precisionGap, '0') < 0);
  for (const x of [a,b,c]) {
    equal(x.gap, E.add(E.add(x.costGap, x.precisionGap), x.roundGap));
    assert.ok(E.cmp(x.roundGap, '0') >= 0);
    assert.ok(E.cmp(x.roundGap, x.roundingUpBound) < 0);
  }
});

test('a specified multiplier settles charges without inventing an unavailable reference target', () => {
  for (const targetMode of ['discount', 'margin']) {
    const p = plan({q:'1', appliedM:'1.65', targetMode, targetAvailable:false, discount:'', margin:'not-a-target'});
    assert.equal(p.targetAvailable, false);
    for (const field of ['d', 'M', 'targetMarginRate', 'targetMarginPct']) {
      assert.equal(p[field], null, `${field} must remain unavailable`);
    }
    equal(p.usedM, '1.65');
    equal(p.S, '15.38');
    equal(p.U, E.div('100', '1538'));
    equal(p.breakEvenM, '1.538');

    const x = E.settle('1', '1', p);
    equal(x.raw, '16.5');
    equal(x.N, '17');
    equal(x.cash, E.div('1700', '1538'));
    equal(x.roundGap, E.div('50', '1538'));
    equal(x.profit, E.sub(E.div('1700', '1538'), '1'));
    for (const field of ['target', 'idealPoints', 'gap', 'costGap', 'precisionGap', 'targetProfit', 'targetCashProfit']) {
      assert.equal(x[field], null, `${field} needs an available reference target`);
    }
    const withReference = E.settle('1', '1', plan({q:'1', appliedM:'1.65', discount:'10'}));
    for (const field of ['raw', 'N', 'cash', 'rawCash', 'roundGap', 'profit', 'margin', 'costMarkupPct', 'unroundedCashProfit', 'effective']) {
      equal(x[field], withReference[field], `${field} does not depend on the reference target`);
    }
  }
});

test('an unavailable target requires a valid specified multiplier; normal target validation remains strict', () => {
  for (const appliedM of ['', null, undefined]) {
    assert.throws(() => plan({targetAvailable:false, appliedM}), /须指定有效倍率/);
  }
  for (const appliedM of ['0', '-1']) {
    assert.throws(() => plan({targetAvailable:false, appliedM}), /倍率须大于零/);
  }
  assert.throws(() => plan({targetAvailable:false, appliedM:'invalid'}), /十进制数/);
  assert.throws(() => plan({discount:'', appliedM:'1.65'}), /十进制数/);
  assert.throws(() => plan({targetMode:'margin', margin:'100', appliedM:'1.65'}), /模型毛利率/);
  for (const options of [{discount:'8'}, {targetMode:'margin', margin:'8.125'}, {discount:'8', appliedM:'1.65'}]) {
    const implicit = plan(options), explicit = plan({...options, targetAvailable:true});
    assert.equal(implicit.targetAvailable, true);
    assert.deepEqual(implicit, explicit);
    assert.deepEqual(theory('1.8816', implicit), theory('1.8816', explicit));
  }
});

test('task totals retain per-request rounding and profit when no reference target is available', () => {
  const p = plan({appliedM:'1.65', targetAvailable:false});
  const rows = [{P:'0.1', C:'0.0735', qty:'3'}];
  const total = E.sumTasks(rows, p);
  assert.equal(total.count, 3);
  equal(total.N, '6');
  equal(total.C, '0.2205');
  equal(total.cash, E.div('600', '1538'));
  equal(total.cashProfit, E.sub(total.cash, '0.2205'));
  equal(E.ceil(E.mul(E.settle('0.1', '0.0735', p).raw, '3')), '4');
  assert.equal(total.target, null);
  assert.equal(total.gap, null);
  const withReference = E.sumTasks(rows, plan({appliedM:'1.65'}));
  for (const field of ['N', 'C', 'cash', 'cashProfit', 'salesMarginPct', 'costMarkupPct']) {
    equal(total[field], withReference[field]);
  }
  const empty = E.sumTasks([], p);
  assert.equal(empty.target, null);
  assert.equal(empty.gap, null);
  equal(empty.cash, '0');
});

test('recorded costs recalculate without a reference target while missing facts stay missing', () => {
  const p = plan({appliedM:'1.65', targetAvailable:false});
  const original = {P:'10', C:'8', N:'99'};
  const recorded = E.recalcRecord(original, p);
  equal(recorded.raw, '132');
  equal(recorded.N, '132');
  equal(recorded.cash, E.div('13200', '1538'));
  equal(recorded.cashProfit, E.sub(recorded.cash, '8'));
  assert.equal(recorded.target, null);
  assert.equal(recorded.x.target, null);
  assert.equal(recorded.x.gap, null);
  equal(recorded.x.roundGap, '0');
  assert.equal(recorded.recordedN, '99');
  assert.deepEqual(original, {P:'10', C:'8', N:'99'});
  const costOnly = E.recalcRecord({P:'', C:'8', N:''}, p);
  assert.equal(costOnly.P, null);
  assert.equal(costOnly.target, null);
  assert.equal(costOnly.x, null);
  equal(costOnly.cash, recorded.cash);
  const missingCost = E.recalcRecord({P:'10', C:'', N:'99'}, p);
  for (const field of ['C', 'raw', 'N', 'cash', 'target', 'cashProfit']) assert.equal(missingCost[field], null);
  assert.equal(missingCost.recordedN, '99');
  const zeroCost = E.recalcRecord({P:'10', C:'0', N:''}, p);
  equal(zeroCost.N, '0');
  equal(zeroCost.cashProfit, '0');
  assert.equal(zeroCost.target, null);
  assert.equal(zeroCost.salesMarginPct, null);
});

test('quantities charge each rounded request instead of rounding the aggregate', () => {
  const p = plan({discount:'8'});
  const one = theory('1', p);
  equal(one.raw, '12.304');
  equal(one.N, '13');
  const total = E.sumTasks([{P:'1', C:'0.735', qty:'3'}], p);
  equal(total.N, '39');
  equal(E.ceil(E.mul(one.raw, '3')), '37');
  equal(total.cash, E.mul(one.cash, '3'));
  equal(total.cashProfit, E.mul(one.cashProfit, '3'));
  assert.throws(() => E.sumTasks([{P:'1', C:'0.735', qty:0}], p), /正整数/);
});

test('missing recorded cost stays missing; historical points are independent', () => {
  const p = plan({discount:'8'});
  const missing = E.recalcRecord({P:'10', C:'', N:'18'}, p);
  assert.equal(missing.C, null);
  assert.equal(missing.raw, null);
  assert.equal(missing.N, null);
  assert.equal(missing.cash, null);
  assert.equal(missing.cashProfit, null);
  assert.equal(missing.recordedN, '18');
  equal(missing.target, '8');
  const marginPlan = plan({targetMode:'margin', margin:'20'});
  assert.equal(E.recalcRecord({P:'10', C:'', N:''}, marginPlan).target, null);
  const costOnly = E.recalcRecord({P:'', C:'8', N:'99'}, marginPlan);
  equal(costOnly.target, '10');
  assert.equal(costOnly.P, null);
  assert.equal(costOnly.x, null);
  assert.equal(costOnly.recordedN, '99');
  assert.ok(costOnly.cashProfit !== null);
});

test('zero recorded procurement is valid without undefined percentage division', () => {
  for (const p of [plan(), plan({targetMode:'margin', margin:'20'})]) {
    const z = E.recalcRecord({P:'10', C:'0', N:''}, p);
    equal(z.C, '0');
    equal(z.raw, '0');
    equal(z.N, '0');
    equal(z.cash, '0');
    equal(z.cashProfit, '0');
    assert.equal(z.salesMarginPct, null);
    assert.equal(z.costMarkupPct, null);
    assert.equal(z.x.margin, null);
    assert.equal(z.x.costMarkupPct, null);
  }
  assert.throws(() => E.recalcRecord({P:'10', C:'-1'}, plan()), /不能为负/);
});

test('unknown video minimum remains partial; a supplied minimum is max, not addition', () => {
  const base = E.estimate(videoTask);
  assert.equal(base.partial, true);
  assert.equal(base.status, 'base-theory');
  assert.equal(base.minimum, null);
  equal(base.tokens, '57600');
  equal(base.P, '1.6128');
  const floor = E.estimate(videoTask, '100000');
  assert.equal(floor.partial, false);
  equal(floor.billedTokens, '100000');
  equal(floor.P, '2.8');
  equal(E.estimate({...videoTask, vin:'3'}, '100000').P, '2.8');
  const above = E.estimate({...videoTask, vin:'10'}, '100000');
  equal(above.tokens, '134400');
  equal(above.billedTokens, above.tokens);
  equal(above.P, '3.7632');
  const explicitZero = E.estimate(videoTask, 0);
  assert.equal(explicitZero.partial, false);
  equal(explicitZero.P, base.P);
  assert.throws(() => E.estimate(videoTask, '-1'), /不能为负/);
});

test('official 4-second output minimum covers 2/3-second input and yields to 4-second input', () => {
  const floor = '67200';
  for (const vin of ['2', '3']) {
    const x = E.estimate({...videoTask, vin}, floor);
    equal(x.billedTokens, floor);
    equal(x.P, '1.8816');
    assert.equal(x.partial, false);
  }
  const longerInput = E.estimate({...videoTask, vin:'4'}, floor);
  equal(longerInput.tokens, '76800');
  equal(longerInput.billedTokens, '76800');
  equal(longerInput.P, '2.1504');
});

test('canonical seconds and boolean strings cannot select the wrong rate path', () => {
  for (const value of ['4', '04', '4.0', ' 04 ', 4]) {
    assert.equal(E.normalizeSeconds(value), '4');
    const result = E.estimate({...videoTask, seconds:value}, '100000');
    assert.equal(result.normalizedSeconds, '4');
    equal(result.P, '2.8');
  }
  assert.throws(() => E.normalizeSeconds('4.5'), /整数/);
  assert.throws(() => E.normalizeSeconds('auto'), /十进制/);
  assert.equal(E.estimate({...videoTask, seconds:'auto'}).status, 'unresolved');
  const noVideo = E.estimate({...videoTask, video:'false', vin:'not-used'}, '100000');
  assert.equal(noVideo.partial, false);
  assert.equal(noVideo.minimum, null);
  equal(noVideo.P, '1.7664');
  equal(noVideo.rate, '46');
  equal(E.estimate({...videoTask, video:'true'}, '100000').P, '2.8');
  equal(E.fromUsage({...videoTask, video:'false'}, '100000'), '4.6');
  assert.throws(() => E.estimate({...videoTask, video:'yes'}), /标识/);
});
