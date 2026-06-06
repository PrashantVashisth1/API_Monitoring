import * as React from 'react';

const Table = React.forwardRef(({ className, ...props }, ref) => (
    <div className="relative w-full overflow-auto border border-zinc-800 rounded-lg">
        <table
            ref={ref}
            className={`w-full caption-bottom text-sm ${className || ''}`}
            {...props}
        />
    </div>
));
Table.displayName = 'Table';

const TableHeader = React.forwardRef(({ className, ...props }, ref) => (
    <thead ref={ref} className={`border-b border-zinc-800 bg-[#0f0f12] ${className || ''}`} {...props} />
));
TableHeader.displayName = 'TableHeader';

const TableBody = React.forwardRef(({ className, ...props }, ref) => (
    <tbody
        ref={ref}
        className={`[&_tr:last-child]:border-0 bg-[#09090b] ${className || ''}`}
        {...props}
    />
));
TableBody.displayName = 'TableBody';

const TableFooter = React.forwardRef(({ className, ...props }, ref) => (
    <tfoot
        ref={ref}
        className={`border-t border-zinc-800 bg-[#0f0f12] font-medium ${className || ''}`}
        {...props}
    />
));
TableFooter.displayName = 'TableFooter';

const TableRow = React.forwardRef(({ className, ...props }, ref) => (
    <tr
        ref={ref}
        className={`border-b border-zinc-800/60 transition-colors hover:bg-zinc-800/30 data-[state=selected]:bg-zinc-800/50 ${className || ''}`}
        {...props}
    />
));
TableRow.displayName = 'TableRow';

const TableHead = React.forwardRef(({ className, ...props }, ref) => (
    <th
        ref={ref}
        className={`h-10 px-4 text-left align-middle font-medium text-zinc-400 uppercase text-xs tracking-wider [&:has([role=checkbox])]:pr-0 ${className || ''}`}
        {...props}
    />
));
TableHead.displayName = 'TableHead';

const TableCell = React.forwardRef(({ className, ...props }, ref) => (
    <td
        ref={ref}
        className={`p-4 align-middle [&:has([role=checkbox])]:pr-0 text-zinc-300 ${className || ''}`}
        {...props}
    />
));
TableCell.displayName = 'TableCell';

const TableCaption = React.forwardRef(({ className, ...props }, ref) => (
    <caption
        ref={ref}
        className={`mt-4 text-sm text-zinc-500 ${className || ''}`}
        {...props}
    />
));
TableCaption.displayName = 'TableCaption';

export {
    Table,
    TableHeader,
    TableBody,
    TableFooter,
    TableHead,
    TableRow,
    TableCell,
    TableCaption,
};
