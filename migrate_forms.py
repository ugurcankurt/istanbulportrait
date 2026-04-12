import os

def update_form_file(filepath, cancel_route):
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        return
        
    with open(filepath, 'r') as f:
        content = f.read()

    # 1. Add imports
    if 'ButtonGroup' not in content:
        content = content.replace(
            'import { Button } from "@/components/ui/button";',
            'import { Button } from "@/components/ui/button";\nimport { ButtonGroup } from "@/components/ui/button-group";'
        )
    if 'Field,' not in content and 'Field' not in content:
        content = content.replace(
            'import { Label } from "@/components/ui/label";',
            'import { Label } from "@/components/ui/label";\nimport { Field, FieldLabel } from "@/components/ui/field";'
        )

    # 2. Modify Button block
    # from: <div className="flex justify-end gap-4 py-4 sticky bottom-0 bg-background border-t pt-4">
    # to:   <div className="flex justify-end py-4 sticky bottom-0 bg-background border-t pt-4"> <ButtonGroup>
    orig_btn = '<div className="flex justify-end gap-4 py-4 sticky bottom-0 bg-background border-t pt-4">'
    new_btn = orig_btn.replace('gap-4 ', '') + '\n          <ButtonGroup>'
    
    if orig_btn in content:
        content = content.replace(orig_btn, new_btn)
        # Find the closing div for this block and insert </ButtonGroup> before it.
        # This is usually exactly 2 buttons and then </div>
        # A bit hacky but we know the exact structure
        content = content.replace(
            '</Button>\n        </div>\n      </form>',
            '</Button>\n          </ButtonGroup>\n        </div>\n      </form>'
        )

    # 3. Modify loose Labels to Field > FieldLabel
    # For package-form: <div className="space-y-4">\n                  <Label>Cover Image</Label>
    # -> <Field className="space-y-4">\n                  <FieldLabel>Cover Image</FieldLabel>
    content = content.replace(
        '<div className="space-y-4">\n                  <Label>Cover Image</Label>',
        '<Field className="space-y-4">\n                  <FieldLabel>Cover Image</FieldLabel>'
    ).replace(
        '</Label>\n                  )}\n                </div>',
        '</Label>\n                  )}\n                </Field>'
    )

    content = content.replace(
        '<div className="space-y-4">\n                  <Label>Gallery Images</Label>',
        '<Field className="space-y-4">\n                  <FieldLabel>Gallery Images</FieldLabel>'
    ).replace(
        '</Label>\n                </div>\n              </CardContent>',
        '</Label>\n                </Field>\n              </CardContent>'
    )
    
    # Try alternate spacing for location-form
    content = content.replace(
        '<div className="space-y-4">\n                  <Label className="mb-2 block">Hero Image (Cover)</Label>',
        '<Field className="space-y-4">\n                  <FieldLabel className="mb-2 block">Hero Image (Cover)</FieldLabel>'
    ).replace(
        '<div className="space-y-4">\n                  <Label className="mb-2 block">Gallery Images</Label>',
        '<Field className="space-y-4">\n                  <FieldLabel className="mb-2 block">Gallery Images</FieldLabel>'
    )

    with open(filepath, 'w') as f:
        f.write(content)
    print(f"Updated {filepath}")

update_form_file('/Users/ugurcankurt/Desktop/istanbulphotosssion/components/admin/packages/package-form.tsx', '/admin/dashboard/packages')
update_form_file('/Users/ugurcankurt/Desktop/istanbulphotosssion/components/admin/locations/location-form.tsx', '/admin/dashboard/locations')

