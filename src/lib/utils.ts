import { type ClassValue, clsx } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function generateQR(seed: number): number[][] {
  const N = 21;
  const grid: number[][] = Array.from({ length: N }, () => new Array(N).fill(0));

  function finder(r: number, c: number) {
    for (let i = 0; i < 7; i++)
      for (let j = 0; j < 7; j++) {
        if (i === 0 || i === 6 || j === 0 || j === 6) grid[r + i][c + j] = 1;
        else if (i >= 2 && i <= 4 && j >= 2 && j <= 4) grid[r + i][c + j] = 1;
        else grid[r + i][c + j] = 0;
      }
  }
  finder(0, 0); finder(0, 14); finder(14, 0);

  for (let i = 0; i < 8; i++) {
    if (i < N) { grid[7][i] = 0; grid[i][7] = 0; }
    if (i < N) { grid[7][N - 1 - i] = 0; grid[i][N - 8] = 0; }
    if (i < N) { grid[N - 8][i] = 0; grid[N - 1 - i][7] = 0; }
  }
  for (let i = 8; i < 13; i++) { grid[6][i] = i % 2 === 0 ? 1 : 0; grid[i][6] = i % 2 === 0 ? 1 : 0; }
  grid[13][8] = 1;

  let s = seed || 12345;
  function rand() { s = (s * 1103515245 + 12345) & 0x7fffffff; return (s >> 10) & 1; }

  const reserved = new Set<string>();
  for (let i = 0; i < 9; i++) for (let j = 0; j < 9; j++) {
    reserved.add(i + "," + j); reserved.add(i + "," + (N - 1 - j)); reserved.add((N - 1 - i) + "," + j);
  }
  for (let i = 8; i < 13; i++) { reserved.add("6," + i); reserved.add(i + ",6"); }

  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    if (!reserved.has(r + "," + c)) grid[r][c] = rand();
  }
  return grid;
}

export function getRoleClass(role: string): string {
  const map: Record<string, string> = {
    VIP: "role-vip",
    Media: "role-media",
    Athlete: "role-athlete",
    Staff: "role-staff",
    Official: "role-official",
    Coach: "role-coach",
  };
  return map[role] ?? "role-staff";
}
