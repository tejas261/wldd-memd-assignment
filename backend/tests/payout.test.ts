import { calculatePayout, calculateIncrement } from '../src/utils/payout';

const ladder = [
  { views: 10_000, payout: 500 },
  { views: 50_000, payout: 2000 },
  { views: 100_000, payout: 5000 },
];
describe('milestones and budget cap', () => {
  test.each([
    [0, 0],
    [9999, 0],
    [10000, 500],
    [49999, 500],
    [50000, 2000],
    [100000, 5000],
    [250000, 5000],
  ])('%i views earns %i rupees', (views, expected) => {
    expect(calculatePayout(views, ladder)).toBe(expected);
  });
  test('handles an unsorted ladder and an empty ladder', () => {
    expect(calculatePayout(60000, [...ladder].reverse())).toBe(2000);
    expect(calculatePayout(60000, [])).toBe(0);
  });
  test('milestones are cumulative, not additive', () => {
    expect(calculateIncrement(2000, 500, 9000)).toBe(1500);
  });
  test('a jump across two milestones pays only the highest total', () => {
    expect(calculateIncrement(calculatePayout(100000, ladder), 0, 10000)).toBe(5000);
  });
  test('pays only the remaining budget on a partial payout', () => {
    expect(calculateIncrement(5000, 500, 700)).toBe(700);
  });
  test('exactly exhausts the budget', () => {
    expect(calculateIncrement(2000, 500, 1500)).toBe(1500);
  });
  test.each([
    [2000, 2000, 9000],
    [500, 2000, 9000],
    [5000, 0, 0],
    [5000, 0, -10],
  ])('never repays or creates a negative delta', (eligible, paid, remaining) => {
    expect(calculateIncrement(eligible, paid, remaining)).toBe(0);
  });
});
