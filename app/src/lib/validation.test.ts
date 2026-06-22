import { describe, it, expect } from 'vitest';
import {
  usernameSchema,
  displayNameSchema,
  descriptionSchema,
  imageUrlSchema,
  messageSchema,
  solAmountSchema,
  solanaAddressSchema,
  profileFormSchema,
  tipFormSchema,
  goalFormSchema,
  validate,
  sanitizeText,
  LIMITS,
} from './validation';

describe('Username Schema', () => {
  it('accepts valid usernames', () => {
    expect(usernameSchema.safeParse('alice').success).toBe(true);
    expect(usernameSchema.safeParse('alice_123').success).toBe(true);
    expect(usernameSchema.safeParse('user_name_123').success).toBe(true);
  });

  it('rejects too short usernames', () => {
    const result = usernameSchema.safeParse('ab');
    expect(result.success).toBe(false);
  });

  it('rejects too long usernames', () => {
    const result = usernameSchema.safeParse('a'.repeat(33));
    expect(result.success).toBe(false);
  });

  it('rejects uppercase letters', () => {
    const result = usernameSchema.safeParse('Alice');
    expect(result.success).toBe(false);
  });

  it('rejects special characters', () => {
    expect(usernameSchema.safeParse('alice!').success).toBe(false);
    expect(usernameSchema.safeParse('alice@bob').success).toBe(false);
    expect(usernameSchema.safeParse('alice-bob').success).toBe(false);
  });

  it('transforms to lowercase', () => {
    const result = usernameSchema.safeParse('alice');
    expect(result.success && result.data).toBe('alice');
  });
});

describe('Display Name Schema', () => {
  it('accepts valid display names', () => {
    expect(displayNameSchema.safeParse('Alice').success).toBe(true);
    expect(displayNameSchema.safeParse('Alice Bob').success).toBe(true);
  });

  it('rejects empty display names', () => {
    expect(displayNameSchema.safeParse('').success).toBe(false);
  });

  it('rejects too long display names', () => {
    expect(displayNameSchema.safeParse('a'.repeat(65)).success).toBe(false);
  });

  it('trims whitespace', () => {
    const result = displayNameSchema.safeParse('  Alice  ');
    expect(result.success && result.data).toBe('Alice');
  });
});

describe('Description Schema', () => {
  it('accepts valid descriptions', () => {
    expect(descriptionSchema.safeParse('Hello world').success).toBe(true);
    expect(descriptionSchema.safeParse(undefined).success).toBe(true);
  });

  it('rejects too long descriptions', () => {
    expect(descriptionSchema.safeParse('a'.repeat(257)).success).toBe(false);
  });
});

describe('Image URL Schema', () => {
  it('accepts HTTPS URLs', () => {
    expect(imageUrlSchema.safeParse('https://example.com/image.png').success).toBe(true);
  });

  it('accepts IPFS URLs', () => {
    expect(imageUrlSchema.safeParse('ipfs://QmXxx...').success).toBe(true);
  });

  it('rejects HTTP URLs', () => {
    expect(imageUrlSchema.safeParse('http://example.com/image.png').success).toBe(false);
  });

  it('accepts empty string', () => {
    expect(imageUrlSchema.safeParse('').success).toBe(true);
  });

  it('accepts undefined', () => {
    expect(imageUrlSchema.safeParse(undefined).success).toBe(true);
  });
});

describe('Message Schema', () => {
  it('accepts valid messages', () => {
    expect(messageSchema.safeParse('Great content!').success).toBe(true);
    expect(messageSchema.safeParse(undefined).success).toBe(true);
  });

  it('rejects too long messages', () => {
    expect(messageSchema.safeParse('a'.repeat(281)).success).toBe(false);
  });
});

describe('SOL Amount Schema', () => {
  it('accepts valid amounts', () => {
    expect(solAmountSchema.safeParse(1).success).toBe(true);
    expect(solAmountSchema.safeParse(0.1).success).toBe(true);
    expect(solAmountSchema.safeParse(100).success).toBe(true);
  });

  it('rejects zero', () => {
    expect(solAmountSchema.safeParse(0).success).toBe(false);
  });

  it('rejects negative amounts', () => {
    expect(solAmountSchema.safeParse(-1).success).toBe(false);
  });

  it('rejects too small amounts', () => {
    expect(solAmountSchema.safeParse(0.0001).success).toBe(false);
  });

  it('rejects too large amounts', () => {
    expect(solAmountSchema.safeParse(1001).success).toBe(false);
  });
});

describe('Solana Address Schema', () => {
  it('accepts valid addresses', () => {
    const validAddress = '11111111111111111111111111111111';
    expect(solanaAddressSchema.safeParse(validAddress).success).toBe(true);
  });

  it('rejects too short addresses', () => {
    expect(solanaAddressSchema.safeParse('ABC123').success).toBe(false);
  });

  it('rejects invalid characters', () => {
    expect(solanaAddressSchema.safeParse('0OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO').success).toBe(false);
  });
});

describe('Profile Form Schema', () => {
  it('validates complete profile', () => {
    const result = profileFormSchema.safeParse({
      username: 'alice',
      displayName: 'Alice',
      description: 'Web3 creator',
      imageUrl: 'https://example.com/avatar.png',
    });
    expect(result.success).toBe(true);
  });

  it('requires username and displayName', () => {
    const result = profileFormSchema.safeParse({
      description: 'Web3 creator',
    });
    expect(result.success).toBe(false);
  });
});

describe('Tip Form Schema', () => {
  it('validates complete tip', () => {
    const result = tipFormSchema.safeParse({
      amount: 1,
      message: 'Great work!',
      recipientAddress: '11111111111111111111111111111111',
    });
    expect(result.success).toBe(true);
  });

  it('requires amount and recipient', () => {
    const result = tipFormSchema.safeParse({
      message: 'Great work!',
    });
    expect(result.success).toBe(false);
  });
});

describe('Goal Form Schema', () => {
  it('validates complete goal', () => {
    const result = goalFormSchema.safeParse({
      title: 'New Camera',
      description: 'Saving for equipment',
      targetAmount: 10,
    });
    expect(result.success).toBe(true);
  });

  it('validates deadline in future', () => {
    const futureTimestamp = Math.floor(Date.now() / 1000) + 86400;
    const result = goalFormSchema.safeParse({
      title: 'New Camera',
      targetAmount: 10,
      deadlineTimestamp: futureTimestamp,
    });
    expect(result.success).toBe(true);
  });

  it('rejects deadline in past', () => {
    const pastTimestamp = Math.floor(Date.now() / 1000) - 86400;
    const result = goalFormSchema.safeParse({
      title: 'New Camera',
      targetAmount: 10,
      deadlineTimestamp: pastTimestamp,
    });
    expect(result.success).toBe(false);
  });
});

describe('validate helper', () => {
  it('returns success with data', () => {
    const result = validate(usernameSchema, 'alice');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe('alice');
    }
  });

  it('returns errors on failure', () => {
    const result = validate(usernameSchema, 'AB');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors).toBeDefined();
    }
  });
});

describe('sanitizeText', () => {
  it('trims whitespace', () => {
    expect(sanitizeText('  hello  ')).toBe('hello');
  });

  it('removes control characters', () => {
    expect(sanitizeText('hello\x00world')).toBe('helloworld');
  });

  it('truncates long text', () => {
    const longText = 'a'.repeat(1500);
    expect(sanitizeText(longText).length).toBe(1000);
  });
});

describe('LIMITS constants', () => {
  it('has expected values', () => {
    expect(LIMITS.USERNAME_MIN).toBe(3);
    expect(LIMITS.USERNAME_MAX).toBe(32);
    expect(LIMITS.MESSAGE_MAX).toBe(280);
    expect(LIMITS.MIN_TIP_SOL).toBe(0.001);
    expect(LIMITS.MAX_TIP_SOL).toBe(1000);
  });
});
