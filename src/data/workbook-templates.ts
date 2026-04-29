/**
 * Starter workbooks for the Models tab. Each is a FortuneSheet sheets array
 * (serialized as JSON when persisted) with header rows and sample rows
 * pre-filled. The `celldata` form lets us drop in only the cells we want.
 */

interface CellEntry {
  r: number;
  c: number;
  v: { v: string | number; m?: string; bl?: number; ff?: number; fc?: string };
}

interface SheetSeed {
  name: string;
  celldata: CellEntry[];
  config?: { columnlen?: Record<number, number> };
  row?: number;
  column?: number;
}

export interface WorkbookTemplate {
  id: string;
  label: string;
  description: string;
  defaultTitle: string;
  sheets: SheetSeed[];
}

function header(values: string[]): CellEntry[] {
  return values.map((v, c) => ({ r: 0, c, v: { v, m: v, bl: 1, fc: '#1a365d' } }));
}

function row(r: number, values: (string | number)[]): CellEntry[] {
  return values.map((v, c) => ({
    r,
    c,
    v: { v, m: typeof v === 'number' ? v.toLocaleString() : v },
  }));
}

export const WORKBOOK_TEMPLATES: ReadonlyArray<WorkbookTemplate> = [
  {
    id: 'damages',
    label: 'Damages Model',
    description: 'Categorized damages tally with subtotals and a grand-total row.',
    defaultTitle: 'Damages Model — [Matter]',
    sheets: [
      {
        name: 'Damages',
        row: 50,
        column: 8,
        config: { columnlen: { 0: 220, 1: 120, 2: 120, 3: 120, 4: 200 } },
        celldata: [
          ...header(['Category', 'Quantity', 'Unit Cost', 'Subtotal', 'Notes']),
          ...row(1, ['Lost Profits — Q1', 1, 0, 0, '']),
          ...row(2, ['Lost Profits — Q2', 1, 0, 0, '']),
          ...row(3, ['Reliance Damages', 1, 0, 0, '']),
          ...row(4, ['Mitigation Costs', 1, 0, 0, '']),
          ...row(5, ['Pre-judgment Interest', 1, 0, 0, '']),
          ...row(7, ['TOTAL', '', '', 0, '']),
        ],
      },
    ],
  },
  {
    id: 'exhibits',
    label: 'Exhibit Index',
    description: 'Deposition / trial exhibit index with bates, source, and admissibility.',
    defaultTitle: 'Exhibit Index — [Witness]',
    sheets: [
      {
        name: 'Exhibits',
        row: 100,
        column: 8,
        config: { columnlen: { 0: 70, 1: 280, 2: 130, 3: 110, 4: 130, 5: 200 } },
        celldata: [
          ...header(['Ex. No.', 'Description', 'Bates Range', 'Date', 'Admitted', 'Notes']),
          ...row(1, [1, '', '', '', '', '']),
          ...row(2, [2, '', '', '', '', '']),
          ...row(3, [3, '', '', '', '', '']),
        ],
      },
    ],
  },
  {
    id: 'privilege',
    label: 'Privilege Log',
    description: 'Standard privilege log with author, recipient, privilege type, and basis.',
    defaultTitle: 'Privilege Log — [Production]',
    sheets: [
      {
        name: 'Privilege Log',
        row: 100,
        column: 8,
        config: { columnlen: { 0: 60, 1: 110, 2: 90, 3: 160, 4: 160, 5: 130, 6: 200 } },
        celldata: [
          ...header(['Bates', 'Date', 'Type', 'From', 'To', 'Privilege', 'Basis']),
          ...row(1, ['', '', '', '', '', '', '']),
          ...row(2, ['', '', '', '', '', '', '']),
        ],
      },
    ],
  },
  {
    id: 'settlement',
    label: 'Settlement Grid',
    description: 'Rapid scenario analysis: probability × value across multiple outcome paths.',
    defaultTitle: 'Settlement Grid — [Matter]',
    sheets: [
      {
        name: 'Scenarios',
        row: 30,
        column: 8,
        config: { columnlen: { 0: 200, 1: 110, 2: 130, 3: 130, 4: 110, 5: 200 } },
        celldata: [
          ...header(['Scenario', 'Probability', 'Plaintiff Recovery', 'Defense Cost', 'EV', 'Notes']),
          ...row(1, ['Win on summary judgment', 0.25, 0, 0, 0, '']),
          ...row(2, ['Win at trial', 0.2, 0, 0, 0, '']),
          ...row(3, ['Loss at trial — low end', 0.15, 0, 0, 0, '']),
          ...row(4, ['Loss at trial — high end', 0.1, 0, 0, 0, '']),
          ...row(5, ['Settle pre-trial', 0.3, 0, 0, 0, '']),
          ...row(7, ['EXPECTED VALUE', '', '', '', 0, '']),
        ],
      },
    ],
  },
  {
    id: 'blank',
    label: 'Blank Workbook',
    description: 'Empty workbook with a single sheet.',
    defaultTitle: 'Untitled Workbook',
    sheets: [{ name: 'Sheet1', row: 50, column: 12, celldata: [] }],
  },
];
