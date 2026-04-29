/**
 * Document templates for the Templates tab. Each renders as a starting
 * point for a fresh draft. Body is HTML (Tiptap accepts HTML on init).
 */

export interface DraftTemplate {
  id: string;
  label: string;
  description: string;
  defaultTitle: string;
  body: string;
}

export const DRAFT_TEMPLATES: ReadonlyArray<DraftTemplate> = [
  {
    id: 'memorandum',
    label: 'Privileged Memorandum',
    description: 'Standard internal memo with privilege header and signature block.',
    defaultTitle: 'Memorandum re: [Matter]',
    body: `
<p><strong>PRIVILEGED &amp; CONFIDENTIAL — ATTORNEY WORK PRODUCT</strong></p>
<p><strong>TO:</strong> [Recipient]<br/>
<strong>FROM:</strong> [Drafter]<br/>
<strong>DATE:</strong> [Date]<br/>
<strong>RE:</strong> [Matter Caption]</p>
<hr/>
<h2>I. Background</h2>
<p></p>
<h2>II. Issues Presented</h2>
<p></p>
<h2>III. Brief Answer</h2>
<p></p>
<h2>IV. Analysis</h2>
<p></p>
<h2>V. Conclusion &amp; Recommendation</h2>
<p></p>
`,
  },
  {
    id: 'irac',
    label: 'IRAC Outline',
    description: 'Issue / Rule / Analysis / Conclusion structure.',
    defaultTitle: 'IRAC — [Issue]',
    body: `
<p><strong>PRIVILEGED &amp; CONFIDENTIAL</strong></p>
<h2>Issue</h2>
<p></p>
<h2>Rule</h2>
<p></p>
<h2>Analysis</h2>
<p></p>
<h2>Conclusion</h2>
<p></p>
`,
  },
  {
    id: 'risk',
    label: 'Risk Memorandum',
    description: 'Identifies risks, mitigations, and open questions.',
    defaultTitle: 'Risk Assessment — [Matter]',
    body: `
<p><strong>PRIVILEGED &amp; CONFIDENTIAL — ATTORNEY WORK PRODUCT</strong></p>
<h2>Background</h2>
<p></p>
<h2>Identified Risks</h2>
<ol><li></li><li></li><li></li></ol>
<h2>Recommended Mitigations</h2>
<p></p>
<h2>Open Questions</h2>
<ul><li></li></ul>
`,
  },
  {
    id: 'redline',
    label: 'Redline Comments',
    description: 'Section-by-section markup notes.',
    defaultTitle: 'Redline — [Document]',
    body: `
<p><strong>PRIVILEGED &amp; CONFIDENTIAL</strong></p>
<h2>§ 1.</h2>
<blockquote><p>[Quoted clause]</p></blockquote>
<p>Comment: </p>
<h2>§ 2.</h2>
<blockquote><p>[Quoted clause]</p></blockquote>
<p>Comment: </p>
`,
  },
  {
    id: 'call',
    label: 'Call Notes',
    description: 'Attendees, discussion, action items.',
    defaultTitle: 'Call Notes — [Counterparty]',
    body: `
<p><strong>PRIVILEGED &amp; CONFIDENTIAL</strong></p>
<p><strong>Date:</strong> [Date]<br/>
<strong>Attendees:</strong> </p>
<h2>Discussion</h2>
<p></p>
<h2>Action Items</h2>
<ul><li>[ ] </li><li>[ ] </li></ul>
`,
  },
  {
    id: 'blank',
    label: 'Blank Document',
    description: 'No template — start fresh.',
    defaultTitle: 'Untitled Draft',
    body: '<p></p>',
  },
];
