# -*- coding: utf-8 -*-
with open('D:/workspace/ngx-datawindow/projects/ngx-datawindow/src/lib/report-designer/report-designer.component.ts', encoding='utf-8') as f:
    lines = f.readlines()

template_start = None
template_end = None

# Find template backticks
for i, line in enumerate(lines):
    stripped = line.strip()
    if 'template: `' in line or (stripped == '`' and template_start and not template_end):
        if not template_start:
            template_start = i
        elif template_start and not template_end:
            template_end = i

print(f'Template: line {template_start+1} to line {template_end+1}')

# Count @ blocks vs {} in template region
open_if = 0; close_if = 0
open_for = 0; close_for = 0
open_switch = 0; close_switch = 0
open_case = 0; close_case = 0
open_default = 0
open_else = 0

for i in range(template_start, min(template_end+1, len(lines))):
    stripped = lines[i].rstrip()
    lnum = i + 1

    # Count @ blocks
    if stripped.startswith('@if'):
        open_if += 1
    elif stripped.startswith('@else'):
        open_else += 1
    elif stripped.startswith('@for'):
        open_for += 1
    elif stripped.startswith('@switch'):
        open_switch += 1
    elif stripped.startswith('@case'):
        open_case += 1
    elif stripped.startswith('@default'):
        open_default += 1

    # Count } that close blocks (in template content lines)
    # We track when we're inside HTML/structural content
    content = stripped
    # Count standalone } as potential closers
    if stripped == '}' and open_if > close_if:
        # Check if this is a template block closer
        prev_lines = lines[max(0,i-3):i]
        has_at_block = any('@' in l for l in prev_lines if '}' not in l and l.strip())
        if open_if > close_if or open_for > 0 or open_switch > close_switch or open_case > close_case:
            # This } likely closes a block
            pass

print(f'\n@if opens: {open_if}, @switch opens: {open_switch}')
print(f'@case opens: {open_case}, @default opens: {open_default}')
print(f'@for opens: {open_for}')

# Find unmatched issues - track depth
depth_if = 0; depth_for = 0; depth_switch = 0
depth_case = 0; depth_default = 0

depth_changes = []
for i in range(template_start, min(template_end+1, len(lines))):
    stripped = lines[i].rstrip()
    lnum = i + 1

    if stripped.startswith('@if'):
        depth_if += 1
        depth_changes.append((lnum, 'open_if', depth_if))
    elif stripped.startswith('@for'):
        depth_for += 1
        depth_changes.append((lnum, 'open_for', depth_for))
    elif stripped.startswith('@switch'):
        depth_switch += 1
        depth_changes.append((lnum, 'open_switch', depth_switch))
    elif stripped.startswith('@case'):
        depth_case += 1
        depth_changes.append((lnum, 'open_case', depth_case))
    elif stripped.startswith('@default'):
        depth_default += 1
        depth_changes.append((lnum, 'open_default', depth_default))
    elif stripped.startswith('@empty') or stripped.startswith('@placeholder'):
        pass
    elif stripped == '}':
        # Try to close most recently opened
        if depth_case > 0:
            depth_case -= 1
            depth_changes.append((lnum, 'close_case', depth_case))
        elif depth_switch > 0 and depth_case == 0:
            depth_switch -= 1
            depth_changes.append((lnum, 'close_switch', depth_switch))

print('\n=== Depth changes ===')
for entry in depth_changes:
    print(f'  {entry}')