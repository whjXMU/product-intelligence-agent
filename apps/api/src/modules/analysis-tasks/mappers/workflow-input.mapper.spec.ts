import type { AnalysisTaskEntity } from '../entities/analysis-task.entity';
import { InputMappingError, toWorkflowInputV1 } from './workflow-input.mapper';

const baseTask = (
  overrides: Partial<AnalysisTaskEntity> = {},
): AnalysisTaskEntity => ({
  id: 'task-1',
  title: 'OpenAI 与 DeepSeek 首页竞品分析',
  productName: 'OpenAI',
  competitorName: 'DeepSeek',
  analysisGoal: '比较首页定位、核心卖点、用户转化路径',
  sourceType: 'manual',
  input: {
    selfUrl: 'https://openai.com',
    competitorUrl: 'https://deepseek.com',
  },
  status: 'created',
  result: null,
  trace: null,
  errorMessage: null,
  createdAt: new Date('2026-06-22T00:00:00.000Z'),
  updatedAt: new Date('2026-06-22T00:00:00.000Z'),
  ...overrides,
});

describe('toWorkflowInputV1', () => {
  it('maps URL inputs to manual_url sources', () => {
    const input = toWorkflowInputV1(baseTask());

    expect(input).toMatchObject({
      schemaVersion: 'analysis_task_input.v1',
      subject: {
        productName: 'OpenAI',
        competitorNames: ['DeepSeek'],
      },
      goal: {
        primaryQuestion: '比较首页定位、核心卖点、用户转化路径',
        focusAreas: [],
        audience: 'pm',
      },
      outputPreferences: {
        language: 'zh-CN',
        detailLevel: 'standard',
        includePrdSuggestions: true,
      },
    });
    expect(input.sources).toEqual([
      {
        type: 'manual_url',
        role: 'self',
        name: 'OpenAI',
        url: 'https://openai.com',
      },
      {
        type: 'manual_url',
        role: 'competitor',
        name: 'DeepSeek',
        url: 'https://deepseek.com',
      },
    ]);
  });

  it('maps notes-only input to a manual_text source', () => {
    const input = toWorkflowInputV1(
      baseTask({
        input: {
          notes: '请重点比较首屏价值主张。',
        },
      }),
    );

    expect(input.sources).toEqual([
      {
        type: 'manual_text',
        role: 'self',
        name: 'OpenAI',
        content: '请重点比较首屏价值主张。',
      },
    ]);
  });

  it('keeps supported optional workflow preferences', () => {
    const input = toWorkflowInputV1(
      baseTask({
        input: {
          selfUrl: 'https://openai.com',
          competitorUrl: 'https://deepseek.com',
          focusAreas: [' 定位表达 ', '转化路径', ''],
          audience: 'founder',
          language: 'en-US',
          detailLevel: 'deep',
          includePrdSuggestions: false,
        },
      }),
    );

    expect(input.goal).toMatchObject({
      focusAreas: ['定位表达', '转化路径'],
      audience: 'founder',
    });
    expect(input.outputPreferences).toEqual({
      language: 'en-US',
      detailLevel: 'deep',
      includePrdSuggestions: false,
    });
  });

  it('throws a mapping error when generated V1 input is invalid', () => {
    expect(() =>
      toWorkflowInputV1(
        baseTask({
          input: {
            selfUrl: 'not-a-valid-url',
          },
        }),
      ),
    ).toThrow(InputMappingError);
  });
});
