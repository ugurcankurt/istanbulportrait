import os
import re

files_to_check = [
    "components/instagram-feed.tsx",
    "components/reviews/reviews-client.tsx",
    "components/booking-success.tsx",
    "components/not-found-content.tsx",
    "components/about-section.tsx",
    "components/blog-author.tsx",
    "components/error-content.tsx",
    "components/booking-card.tsx",
    "components/package-gallery.tsx",
    "components/breadcrumb-nav.tsx"
]

def fix_file(filepath):
    if not os.path.exists(filepath):
        return
    
    with open(filepath, 'r') as f:
        content = f.read()

    original_content = content

    # 1. Replace <Button ... asChild ...> <Element ...> Text </Element> </Button>
    # It's better to just replace `asChild` with `render={<a />}` manually or just remove `asChild` 
    # Actually wait. If I just remove `asChild` and leave the <a> or <Link> inside <Button>, what happens?
    # <Button><Link>Text</Link></Button> 
    # This renders as <button><a href="...">Text</a></button>. Is this valid HTML? It's generally frowned upon, but React doesn't outright crash. 
    # Ah, Shadcn's hydration error for `asChild` on DOM element actually means we passed `asChild` to something that didn't consume it.

    # Instead of regex, I will do it with multi_replace_file_content calls 
    # Let's just output the exact line items
    lines = content.split('\n')
    for i, line in enumerate(lines):
        if 'asChild' in line:
            print(f"{filepath}:{i+1}: {line}")

for f in files_to_check:
    fix_file(f)
