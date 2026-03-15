-- Populate measurements, Wikipedia URLs, and satellite filenames
-- for the three famous fjords added in 20260315000000.

UPDATE fjordle_fjords SET
  satellite_filename = '1468_Sognefjorden.png',
  length_km = 204,
  depth_m = 1308,
  width_km = 4.5,
  measurement_source_url = 'https://no.wikipedia.org/wiki/Sognefjorden',
  wikipedia_url_no = 'https://no.wikipedia.org/wiki/Sognefjorden',
  wikipedia_url_en = 'https://en.wikipedia.org/wiki/Sognefjorden',
  wikipedia_url_nn = 'https://nn.wikipedia.org/wiki/Sognefjorden'
WHERE id = 1468;

UPDATE fjordle_fjords SET
  satellite_filename = '1469_Hardangerfjorden.png',
  length_km = 179,
  depth_m = 800,
  width_km = 6,
  measurement_source_url = 'https://no.wikipedia.org/wiki/Hardangerfjorden',
  wikipedia_url_no = 'https://no.wikipedia.org/wiki/Hardangerfjorden',
  wikipedia_url_en = 'https://en.wikipedia.org/wiki/Hardangerfjorden',
  wikipedia_url_nn = 'https://nn.wikipedia.org/wiki/Hardangerfjorden'
WHERE id = 1469;

UPDATE fjordle_fjords SET
  satellite_filename = '1470_Oslofjorden.png',
  length_km = 100,
  depth_m = 300,
  width_km = 20,
  measurement_source_url = 'https://no.wikipedia.org/wiki/Oslofjorden',
  wikipedia_url_no = 'https://no.wikipedia.org/wiki/Oslofjorden',
  wikipedia_url_en = 'https://en.wikipedia.org/wiki/Oslofjorden',
  wikipedia_url_nn = 'https://nn.wikipedia.org/wiki/Oslofjorden'
WHERE id = 1470;
