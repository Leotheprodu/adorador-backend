import { IsNotLoggedInGuard } from './is-not-logged-in.guard';

describe('IsNotLoggedInGuard', () => {
  it('should be defined', () => {
    expect(new IsNotLoggedInGuard()).toBeDefined();
  });
});
