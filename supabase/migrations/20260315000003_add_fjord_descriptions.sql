-- Add optional description fields for fjords.
-- When populated, these override the auto-generated measurement text
-- in both on-page content and meta descriptions.

ALTER TABLE fjordle_fjords ADD COLUMN description_no text;
ALTER TABLE fjordle_fjords ADD COLUMN description_en text;

UPDATE fjordle_fjords SET
  description_no = 'Sognefjorden er Norges lengste og dypeste fjord, og den dypeste fjorden i Europa. Fjorden strekker seg 204 km innover i landet fra Solund i vest til Skjolden i Luster i øst. På det dypeste punktet når fjorden 1308 meter under havoverflaten. Sognefjorden er også verdens tredje dypeste fjord, etter Scoresby Sund på Grønland og Skelton Inlet i Antarktis.',
  description_en = 'Sognefjorden is the longest and deepest fjord in Norway, and the deepest fjord in Europe. The fjord stretches 204 km inland from Solund in the west to Skjolden in Luster in the east. At its deepest point, the fjord reaches 1,308 metres below sea level. Sognefjorden is also the third deepest fjord in the world, after Scoresby Sund in Greenland and Skelton Inlet in Antarctica.'
WHERE id = 1468;

UPDATE fjordle_fjords SET
  description_no = 'Hardangerfjorden er Norges nest lengste fjord og den fjerde lengste fjorden i verden. Fjorden strekker seg 179 km fra Atlanterhavet til Odda og Eidfjord innerst i fjorden. Hardangerfjorden er kjent for fruktblomstringen om våren langs fjordens sider, og kalles ofte Norges fruktfat. Regionen er også kjent for Folgefonna nasjonalpark og Hardangervidda.',
  description_en = 'Hardangerfjorden is the second longest fjord in Norway and the fourth longest fjord in the world. The fjord stretches 179 km from the Atlantic Ocean to Odda and Eidfjord at the innermost end. Hardangerfjorden is famous for its spring fruit blossom along the fjord sides, and is often called the fruit basket of Norway. The region is also known for Folgefonna National Park and Hardangervidda.'
WHERE id = 1469;

UPDATE fjordle_fjords SET
  description_no = 'Oslofjorden er en 100 km lang fjord som strekker seg fra Færder fyr i sør til Oslo i nord. Fjorden er en av Norges mest trafikkerte vannveier og er omgitt av noen av landets mest befolkede områder. Oslofjorden har rundt 2 millioner mennesker bosatt langs sine bredder og er viktig for både skipsfart, fiske og friluftsliv.',
  description_en = 'Oslofjorden is a 100 km long fjord stretching from the Færder lighthouse in the south to Oslo in the north. The fjord is one of the busiest waterways in Norway and is surrounded by some of the most populated areas in the country. Around 2 million people live along the shores of Oslofjorden, and it is important for shipping, fishing, and outdoor recreation.'
WHERE id = 1470;
