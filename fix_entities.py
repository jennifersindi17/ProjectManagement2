import os, re, json

entity_dir = '/Users/jenjen/projectflow2/backend/src/modules'

# First, scan all entity files to find camelCase fields without explicit name
for root, dirs, files in os.walk(entity_dir):
    for f in sorted(files):
        if f.endswith('.entity.ts'):
            fpath = os.path.join(root, f)
            with open(fpath) as fh:
                content = fh.read()
            
            # Skip user.entity.ts and project.entity.ts (already fixed)
            if 'user.entity.ts' in fpath or 'project.entity.ts' in fpath:
                continue
            
            lines = content.split('\n')
            modified = False
            new_lines = []
            
            for i, line in enumerate(lines):
                new_lines.append(line)
                stripped = line.strip()
                
                # Check @Column without name: followed by camelCase field
                if '@Column({' in stripped and 'name:' not in stripped:
                    # Look ahead for the field declaration
                    for j in range(i+1, min(i+10, len(lines))):
                        next_stripped = lines[j].strip()
                        # Skip empty lines, decorators, comments
                        if not next_stripped or next_stripped.startswith('@') or next_stripped.startswith('//') or next_stripped.startswith('*') or next_stripped.startswith('/*'):
                            continue
                        # Check for field declaration
                        m = re.match(r'^(\w+)(\??)\s*:', next_stripped)
                        if m:
                            fname = m.group(1)
                            optional = m.group(2)
                            # Check if it's a TypeScript keyword/ts type
                            if fname in ('constructor','return','string','number','boolean','Date','any','void','true','false','null','undefined','import','export','interface','type','enum','const','let','var','new','this','if','else','for','while','switch','case','break','continue','throw','try','catch','finally','typeof','instanceof','async','await','implements','extends','public','private','protected','readonly','static','get','set','function','class','module','namespace','abstract','as','from','is','keyof','never','object','unknown','readonly'):
                                break
                            # Check if camelCase
                            if re.search(r'[a-z][A-Z]', fname):
                                snake = re.sub(r'([a-z])([A-Z])', r'\1_\2', fname).lower()
                                # Insert name: property into the @Column decorator
                                # Find the closing of @Column({...})
                                if '})' in stripped:
                                    # Single line: @Column({ type: ... })
                                    line = line.replace('})', f", name: '{snake}'" + '})')
                                    new_lines[-1] = line
                                    modified = True
                                else:
                                    # Multi-line @Column - we need to add name: before the closing
                                    # Mark this line for later processing
                                    pass
                            break
                
                # Check @CreateDateColumn(), @UpdateDateColumn(), @DeleteDateColumn() without name
                if any(x in stripped for x in ['@CreateDateColumn()', '@UpdateDateColumn()', '@DeleteDateColumn()']):
                    for j in range(i+1, min(i+5, len(lines))):
                        next_stripped = lines[j].strip()
                        if not next_stripped or next_stripped.startswith('@') or next_stripped.startswith('//') or next_stripped.startswith('*'):
                            continue
                        m = re.match(r'^(\w+)(\??)\s*:', next_stripped)
                        if m:
                            fname = m.group(1)
                            if re.search(r'[a-z][A-Z]', fname):
                                snake = re.sub(r'([a-z])([A-Z])', r'\1_\2', fname).lower()
                                line = stripped.replace('@CreateDateColumn()', f"@CreateDateColumn({{ name: '{snake}' }})")
                                line = line.replace('@UpdateDateColumn()', f"@UpdateDateColumn({{ name: '{snake}' }})")
                                line = line.replace('@DeleteDateColumn()', f"@DeleteDateColumn({{ name: '{snake}' }})")
                                new_lines[-1] = line
                                modified = True
                            break
            
            if modified:
                with open(fpath, 'w') as fh:
                    fh.write('\n'.join(new_lines))
                rel = os.path.relpath(fpath, entity_dir)
                print(f"✅ Fixed: {rel}")

print("\nDone!")
