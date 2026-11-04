import type { Scenario, ScenarioDriver, TraceFrame } from './types.js';

export async function runScenario(
  driver: ScenarioDriver,
  scenario: Scenario,
): Promise<TraceFrame[]> {
  await driver.mount(scenario.app, scenario.mount);
  const trace: TraceFrame[] = [];
  for (const step of scenario.steps) {
    switch (step.t) {
      case 'props':
        await driver.setProps(step.props, { transition: step.transition });
        break;
      case 'waitInit':
        await driver.waitInit();
        break;
      case 'mouseAt':
        await driver.mouseAt(step.kind, step.ll, step.dx ?? 0, step.dy ?? 0);
        break;
      case 'frames':
        for (let i = 0; i < step.n; i++) trace.push(await driver.frame());
        break;
      case 'call':
        await driver.call(step.method, step.args ?? []);
        break;
      case 'mouse':
        await driver.mouse(step.kind, step.x, step.y);
        break;
      case 'wheel':
        await driver.wheel(step.x, step.y, step.deltaY);
        break;
      case 'realtime':
        await driver.realtime(step.ms);
        break;
      case 'clickCenter':
        await driver.clickCenter();
        break;
      case 'dblclickCenter':
        await driver.dblclickCenter();
        break;
      case 'setState':
        await driver.setState({ center: step.center, zoom: step.zoom });
        break;
      case 'touch':
        await driver.touch(step.kind, step.points);
        break;
      case 'shot':
        await driver.shot(step.name);
        break;
      case 'probe': {
        const value = await driver.probe(step.name);
        const last = trace.at(-1);
        if (last && value !== null)
          last.probes = { ...last.probes, [step.name]: value };
        break;
      }
    }
  }
  return trace;
}

export function violations(scenario: Scenario, trace: TraceFrame[]): string[] {
  return scenario.expect
    .map((assertion) => assertion(trace))
    .filter((v): v is string => v !== null);
}
