import { COLORS } from '@/constants/colors';

export class AppFns {
  static getRandomColor = (): string =>
    COLORS[Math.floor(Math.random() * COLORS.length)];
}
