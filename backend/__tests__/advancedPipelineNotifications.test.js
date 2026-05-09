/**
 * @jest-environment node
 */
const { resolveAdvancedPipelineConfig, REMOVAL } = require('../utils/advancedPipelineNotifications');

describe('advancedPipelineNotifications', () => {
    const oldEnv = process.env;

    afterEach(() => {
        process.env = { ...oldEnv };
    });

    it('resolveAdvancedPipelineConfig: désactivé sans enabled ni env', () => {
        const c = resolveAdvancedPipelineConfig({});
        expect(c.enabled).toBe(false);
        expect(c.removeOnCvMismatch).toBe(false);
    });

    it('resolveAdvancedPipelineConfig: activé si advancedPipeline.enabled true', () => {
        const c = resolveAdvancedPipelineConfig({
            advancedPipeline: { enabled: true, matchPassThreshold: 60 },
        });
        expect(c.enabled).toBe(true);
        expect(c.matchPassThreshold).toBe(60);
        expect(c.removeOnCvMismatch).toBe(true);
    });

    it('resolveAdvancedPipelineConfig: ADVANCED_PIPELINE_DEFAULT active tout', () => {
        process.env.ADVANCED_PIPELINE_DEFAULT = 'true';
        const c = resolveAdvancedPipelineConfig({});
        expect(c.enabled).toBe(true);
    });

    it('resolveAdvancedPipelineConfig: DISABLE_ADVANCED_PIPELINE force off', () => {
        process.env.DISABLE_ADVANCED_PIPELINE = 'true';
        const c = resolveAdvancedPipelineConfig({
            advancedPipeline: { enabled: true },
        });
        expect(c.enabled).toBe(false);
    });

    it('REMOVAL constants', () => {
        expect(REMOVAL.NEGATIVE_MATCH).toBe('NEGATIVE_MATCH');
        expect(REMOVAL.FAILED_ASSESSMENT).toBe('FAILED_ASSESSMENT');
    });
});
