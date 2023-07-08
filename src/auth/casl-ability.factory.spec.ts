import { Role, Todo } from '@prisma/client';
import { CaslAbilityFactory } from './casl-ability.factory';
import { UserEntity } from 'src/users/entites/user.entity';
import { Action } from './constants';
import { subject } from '@casl/ability';

describe('CaslAbilityFactory', () => {
  it('should create admin ability', () => {
    const ability = new CaslAbilityFactory().createForUser({
      id: 1,
      roles: [Role.ADMIN],
    } as unknown as UserEntity);

    expect(ability.can(Action.Create, 'Todo')).toBeTruthy();
    expect(ability.can(Action.Read, 'Todo')).toBeTruthy();
    expect(ability.can(Action.Update, 'Todo')).toBeTruthy();
    expect(ability.can(Action.Delete, 'Todo')).toBeTruthy();

    expect(
      ability.can(
        Action.Update,
        subject('Todo', { authorId: 2 } as unknown as Todo),
      ),
    ).toBeTruthy();
    expect(
      ability.can(
        Action.Delete,
        subject('Todo', { authorId: 2 } as unknown as Todo),
      ),
    ).toBeTruthy();
  });

  it('should create user ability', () => {
    const ability = new CaslAbilityFactory().createForUser({
      id: 1,
      roles: [Role.USER],
    } as unknown as UserEntity);

    expect(ability.can(Action.Create, 'Todo')).toBeTruthy();
    expect(ability.can(Action.Read, 'Todo')).toBeTruthy();
    expect(ability.can(Action.Update, 'Todo')).toBeTruthy();
    expect(ability.can(Action.Delete, 'Todo')).toBeTruthy();

    expect(
      ability.can(
        Action.Update,
        subject('Todo', { authorId: 1 } as unknown as Todo),
      ),
    ).toBeTruthy();
    expect(
      ability.can(
        Action.Delete,
        subject('Todo', { authorId: 1 } as unknown as Todo),
      ),
    ).toBeTruthy();

    expect(
      ability.can(
        Action.Update,
        subject('Todo', { authorId: 2 } as unknown as Todo),
      ),
    ).toBeFalsy();
    expect(
      ability.can(
        Action.Delete,
        subject('Todo', { authorId: 2 } as unknown as Todo),
      ),
    ).toBeFalsy();
  });

  it('should create user ability', () => {
    const ability = new CaslAbilityFactory().createForUser({
      id: 1,
      roles: [Role.READONLY_USER],
    } as unknown as UserEntity);

    expect(ability.can(Action.Create, 'Todo')).toBeFalsy();
    expect(ability.can(Action.Read, 'Todo')).toBeTruthy();
    expect(ability.can(Action.Update, 'Todo')).toBeFalsy();
    expect(ability.can(Action.Delete, 'Todo')).toBeFalsy();

    expect(
      ability.can(
        Action.Update,
        subject('Todo', { authorId: 1 } as unknown as Todo),
      ),
    ).toBeFalsy();
    expect(
      ability.can(
        Action.Delete,
        subject('Todo', { authorId: 1 } as unknown as Todo),
      ),
    ).toBeFalsy();

    expect(
      ability.can(
        Action.Update,
        subject('Todo', { authorId: 2 } as unknown as Todo),
      ),
    ).toBeFalsy();
    expect(
      ability.can(
        Action.Delete,
        subject('Todo', { authorId: 2 } as unknown as Todo),
      ),
    ).toBeFalsy();
  });
});
