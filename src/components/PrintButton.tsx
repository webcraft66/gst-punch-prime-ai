'use client';
import { Icon } from './Icon';
export default function PrintButton({ label = 'Print' }: { label?: string }) { return <button className="btn-ghost bg-white" onClick={() => window.print()}><Icon name="print" size={16} />{label}</button>; }
