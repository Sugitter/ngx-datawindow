import re

with open('D:/workspace/ngx-datawindow/projects/ngx-datawindow/src/lib/report-designer/report-designer.component.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

in_template = False
template_start = None
depth = 0
block_stack = []  # (type, depth, line, label)

for i, line in enumerate(lines, 1):
    raw = line.rstrip('\r\n')
    if not in_template:
        stripped = raw.strip()
        if stripped.startswith('template:') or stripped.startswith('template:'):
            if '`' in line:
                in_template = True
                template_start = i
        continue

    if not raw.strip():
        continue

    stripped = raw.lstrip()

    # Detect block openings
    if_match = re.match(r'@if\s*\(', stripped)
    for_match = re.match(r'@for\s*\(', stripped)
    switch_match = re.match(r'@switch\s*\(', stripped)
    case_match = re.match(r"@case\s*\(\s*['\"]([^'\"]+)['\"]\s*\)", stripped)
    default_match = re.match(r'@default\b', stripped)

    if if_match:
        depth += 1
        block_stack.append(('if', depth, i, f'@if'))
        continue
    if for_match:
        depth += 1
        block_stack.append(('for', depth, i, f'@for'))
        continue
    if switch_match:
        depth += 1
        block_stack.append(('switch', depth, i, '@switch'))
        continue
    if case_match:
        case_val = case_match.group(1)
        if depth == 0:
            print(f"LINE {i}: ORPHANED @case('{case_val}') at depth=0!")
        else:
            depth += 1
            block_stack.append(('case', depth, i, f"@case('{case_val}')"))
        continue
    if default_match:
        if depth == 0:
            print(f"LINE {i}: ORPHANED @default at depth=0!")
        else:
            depth += 1
            block_stack.append(('default', depth, i, '@default'))
        continue

    # Detect closings
    if stripped == '}' or stripped == '}'):
        if depth > 0 and block_stack:
            last = block_stack[-1]
            if last[1] == depth:
                print(f"LINE {i} (depth={depth}): closing '{last[3]}' (opened at line {last[2]})")
                block_stack.pop()
                depth -= 1
            else:
                print(f"LINE {i} (depth={depth}): UNEXPECTED closing '}}' - stack top is depth={last[1]} '{last[3]}'")
        else:
            print(f"LINE {i}: UNEXPECTED closing '}}' at depth={depth}")

    # Template end
    if stripped == '`,' or stripped.startswith('`,'):
        print(f"TEMPLATE ENDS at line {i}")
        break

print(f"\nFinal depth: {depth}")
if block_stack:
    print(f"UNCLOSED blocks ({len(block_stack)}):")
    for b in block_stack:
        print(f"  depth={b[1]} line={b[2]}: {b[3]}")
