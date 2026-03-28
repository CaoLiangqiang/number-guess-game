const Renderer = require('../miniprogram/js/engine/renderer');

function createMockContext() {
  const alphaWrites = [];
  let globalAlpha = 1;

  const ctx = {
    save: jest.fn(),
    restore: jest.fn(),
    beginPath: jest.fn(),
    rect: jest.fn(),
    fill: jest.fn(),
    stroke: jest.fn(),
    fillText: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    quadraticCurveTo: jest.fn(),
    closePath: jest.fn(),
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    font: '',
    textAlign: '',
    textBaseline: ''
  };

  Object.defineProperty(ctx, 'globalAlpha', {
    configurable: true,
    get: () => globalAlpha,
    set: (value) => {
      globalAlpha = value;
      alphaWrites.push(value);
    }
  });

  ctx.alphaWrites = alphaWrites;
  return ctx;
}

describe('miniprogram renderer alpha support', () => {
  test('drawRect applies alpha when provided', () => {
    const ctx = createMockContext();
    const renderer = new Renderer(ctx, 375, 667, 1);

    renderer.drawRect(10, 20, 30, 40, { fill: '#ffffff', alpha: 0.35 });

    expect(ctx.alphaWrites).toContain(0.35);
  });

  test('drawText applies alpha when provided', () => {
    const ctx = createMockContext();
    const renderer = new Renderer(ctx, 375, 667, 1);

    renderer.drawText('hello', 12, 34, { color: '#ffffff', alpha: 0.55 });

    expect(ctx.alphaWrites).toContain(0.55);
  });
});
