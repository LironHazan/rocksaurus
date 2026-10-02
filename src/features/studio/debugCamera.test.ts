import { parseDebugCamera } from './debugCamera';

describe('parseDebugCamera', () => {
  it('parses six comma-separated numbers', () => {
    expect(parseDebugCamera('0,1.8,4.2,0,1.5,0')).toEqual([0, 1.8, 4.2, 0, 1.5, 0]);
  });
  it('rejects missing or malformed values', () => {
    expect(parseDebugCamera(null)).toBeNull();
    expect(parseDebugCamera('1,2,3')).toBeNull();
    expect(parseDebugCamera('a,b,c,d,e,f')).toBeNull();
  });
});
