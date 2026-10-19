"""Rebuild manual page illustrations from the four user-supplied PDFs.
Usage: python scripts/extract-assets.py /path/to/upload
Requires PyMuPDF. Original artwork © Rebellion.
"""
import sys, pathlib, fitz, shutil
root=pathlib.Path(__file__).resolve().parents[1]/'sniper-elite'
sources={'core':'SE Core _Rulebook1_webquality3.pdf','eagle':'SE Expansion _Rulebook_webquality2.pdf','escalation':'Sniper_Elite_Escalation_Rulebook.pdf','kraken':'Sniper_Elite_Operation_Kraken_Rulebook.pdf'}
for key,name in sources.items():
 p=pathlib.Path(sys.argv[1])/name
 shutil.copyfile(p,root/'manuals'/f'{key}.pdf')
 d=fitz.open(p)
 for i,page in enumerate(d):
  page.get_pixmap(matrix=fitz.Matrix(1.8,1.8)).pil_save(str(root/'assets'/f'{key}-{i+1}.webp'),format='WEBP',quality=84)
 # Landscape artwork from the original cover, without its printed headings.
 page=d[0];r=page.rect
 page.get_pixmap(matrix=fitz.Matrix(1.6,1.6),clip=fitz.Rect(0,0,r.width,r.height*.63)).pil_save(str(root/'assets'/f'{key}-cover.webp'),format='WEBP',quality=88)
# Source-coordinate crops preserve the actual printed iconography.
def crop(key,page,name,box,scale=1):
 d=fitz.open(root/'manuals'/f'{key}.pdf')
 d[page-1].get_pixmap(matrix=fitz.Matrix(3,3),clip=fitz.Rect([v/scale for v in box])).pil_save(str(root/'assets'/f'{name}.webp'),format='WEBP',quality=90)
for key,box in {'elevated':(20,35,65,82),'objective':(18,178,65,224),'difficult':(18,260,65,304),'water':(20,363,68,411),'obstruction':(20,421,68,469),'officer':(20,546,72,593),'soldier':(20,596,72,644),'entry':(24,665,75,716)}.items():crop('core',11,'icon-'+key,box)
for key,box in {'aim':(521,916,580,977),'suppression':(584,916,643,977),'noise':(647,916,706,977),'recoil':(711,916,769,977)}.items():crop('core',13,'icon-'+key,box,1.3)
for key,box in {'ladder':(254,260,304,381),'duct':(489,263,542,383),'locked':(491,816,527,854),'door':(236,775,285,823)}.items():crop('kraken',6,'icon-'+key,box,1.3)
for key,box in {'vehicle-start':(252,240,314,299),'road':(236,407,293,466),'armour':(520,795,582,862)}.items():crop('kraken',4,'icon-'+key,box,1.3)
# Isolate the diagram for each illustrated case instead of using a whole-page thumbnail.
for key,page,name,box in [('core',5,'noise-example',(289,611,590,763)),('core',7,'shot-miss',(259,353,590,519)),('core',7,'shot-hit',(259,535,590,731)),('core',11,'water-example',(400,299,591,411)),('core',11,'obstruction-example',(400,474,591,651)),('core',12,'los-open',(22,357,394,482)),('core',12,'los-wall',(22,498,394,610)),('core',12,'los-inside',(22,626,394,763)),('core',13,'los-elevated',(206,21,591,293)),('eagle',6,'nest-door',(22,296,451,496)),('kraken',6,'queen',(236,473,414,536))]:crop(key,page,'example-'+name,box)

for key,page,name,box in [("core",14,"launch",(22,62,300,338)),("core",14,"pens",(312,383,590,661)),("eagle",5,"water",(10,10,600,780)),("eagle",7,"nest",(10,10,600,780)),("kraken",3,"carrier",(30,110,208,285)),("kraken",3,"village",(225,110,400,285))]:crop(key,page,"map-"+name,box)
