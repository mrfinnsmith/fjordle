export interface CoastalPort {
  name: string
  lat: number
  lng: number
  order: number
}

export interface CoastalShip {
  mmsi: number
  name: string
  operator: 'hurtigruten' | 'havila'
}

export interface RouteFjord {
  slug: string
  name: string
  nearPortOrder: number
}

export const COASTAL_PORTS: CoastalPort[] = [
  { name: 'Bergen', lat: 60.3913, lng: 5.3221, order: 1 },
  { name: 'Florø', lat: 61.5997, lng: 5.0328, order: 2 },
  { name: 'Måløy', lat: 61.9340, lng: 5.1130, order: 3 },
  { name: 'Torvik', lat: 62.2970, lng: 5.8480, order: 4 },
  { name: 'Ålesund', lat: 62.4722, lng: 6.1495, order: 5 },
  { name: 'Molde', lat: 62.7375, lng: 7.1591, order: 6 },
  { name: 'Kristiansund', lat: 63.1103, lng: 7.7279, order: 7 },
  { name: 'Trondheim', lat: 63.4305, lng: 10.3951, order: 8 },
  { name: 'Rørvik', lat: 64.8603, lng: 11.2370, order: 9 },
  { name: 'Brønnøysund', lat: 65.4750, lng: 12.2130, order: 10 },
  { name: 'Sandnessjøen', lat: 66.0210, lng: 12.6310, order: 11 },
  { name: 'Nesna', lat: 66.1970, lng: 13.0120, order: 12 },
  { name: 'Ørnes', lat: 66.8680, lng: 14.0080, order: 13 },
  { name: 'Bodø', lat: 67.2804, lng: 14.4049, order: 14 },
  { name: 'Stamsund', lat: 68.1200, lng: 13.8400, order: 15 },
  { name: 'Svolvær', lat: 68.2342, lng: 14.5685, order: 16 },
  { name: 'Stokmarknes', lat: 68.5630, lng: 14.9160, order: 17 },
  { name: 'Sortland', lat: 68.6930, lng: 15.4130, order: 18 },
  { name: 'Risøyhamn', lat: 68.9680, lng: 15.8270, order: 19 },
  { name: 'Harstad', lat: 68.8031, lng: 16.5372, order: 20 },
  { name: 'Finnsnes', lat: 69.2330, lng: 17.9810, order: 21 },
  { name: 'Tromsø', lat: 69.6489, lng: 18.9551, order: 22 },
  { name: 'Skjervøy', lat: 70.0330, lng: 20.9720, order: 23 },
  { name: 'Øksfjord', lat: 70.2350, lng: 22.3470, order: 24 },
  { name: 'Hammerfest', lat: 70.6634, lng: 23.6821, order: 25 },
  { name: 'Havøysund', lat: 70.9960, lng: 24.6620, order: 26 },
  { name: 'Honningsvåg', lat: 70.9827, lng: 25.9706, order: 27 },
  { name: 'Kjøllefjord', lat: 70.9490, lng: 27.3450, order: 28 },
  { name: 'Mehamn', lat: 71.0350, lng: 27.8490, order: 29 },
  { name: 'Berlevåg', lat: 70.8580, lng: 29.0860, order: 30 },
  { name: 'Båtsfjord', lat: 70.6340, lng: 29.7240, order: 31 },
  { name: 'Vardø', lat: 70.3716, lng: 31.1088, order: 32 },
  { name: 'Vadsø', lat: 70.0741, lng: 29.7500, order: 33 },
  { name: 'Kirkenes', lat: 69.7271, lng: 30.0458, order: 34 },
]

export const COASTAL_SHIPS: CoastalShip[] = [
  { mmsi: 257200000, name: 'Kong Harald', operator: 'hurtigruten' },
  { mmsi: 259330000, name: 'Nordkapp', operator: 'hurtigruten' },
  { mmsi: 259139000, name: 'Nordlys', operator: 'hurtigruten' },
  { mmsi: 259371000, name: 'Nordnorge', operator: 'hurtigruten' },
  { mmsi: 258500000, name: 'Richard With', operator: 'hurtigruten' },
  { mmsi: 258465000, name: 'Trollfjord', operator: 'hurtigruten' },
  { mmsi: 258478000, name: 'Vesterålen', operator: 'hurtigruten' },
  { mmsi: 257753000, name: 'Havila Capella', operator: 'havila' },
  { mmsi: 257752000, name: 'Havila Castor', operator: 'havila' },
  { mmsi: 258094000, name: 'Havila Polaris', operator: 'havila' },
]

// Fjords the coastal route passes through or near, mapped to DB slugs.
// Ordered roughly south to north along the route.
export const ROUTE_FJORDS: RouteFjord[] = [
  // Bergen area
  { slug: 'byfjorden', name: 'Byfjorden', nearPortOrder: 1 },
  { slug: 'hjeltefjorden', name: 'Hjeltefjorden', nearPortOrder: 1 },
  { slug: 'fensfjord', name: 'Fensfjorden', nearPortOrder: 1 },

  // Florø to Måløy
  { slug: 'nordfjorden', name: 'Nordfjorden', nearPortOrder: 3 },

  // Ålesund area
  { slug: 'sulafjorden', name: 'Sulafjorden', nearPortOrder: 5 },
  { slug: 'storfjorden-837', name: 'Storfjorden', nearPortOrder: 5 },
  { slug: 'hjørundfjorden', name: 'Hjørundfjorden', nearPortOrder: 5 },
  { slug: 'geirangerfjorden', name: 'Geirangerfjorden', nearPortOrder: 5 },

  // Molde area
  { slug: 'romsdalsfjorden-1', name: 'Romsdalsfjorden', nearPortOrder: 6 },
  { slug: 'moldefjorden-875', name: 'Moldefjorden', nearPortOrder: 6 },

  // Kristiansund area
  { slug: 'breisundet-852', name: 'Breisundet', nearPortOrder: 7 },
  { slug: 'freifjorden', name: 'Freifjorden', nearPortOrder: 7 },

  // Trondheim area
  { slug: 'trondheimsfjord-1', name: 'Trondheimsfjorden', nearPortOrder: 8 },
  { slug: 'trondheimsleia-1', name: 'Trondheimsleia', nearPortOrder: 8 },

  // Rørvik area
  { slug: 'foldenfjord', name: 'Foldenfjorden', nearPortOrder: 9 },

  // Sandnessjøen to Nesna
  { slug: 'ytre-vefsnfjord', name: 'Ytre Vefsnfjord', nearPortOrder: 11 },

  // Ørnes to Bodø
  { slug: 'saltfjord', name: 'Saltfjorden', nearPortOrder: 14 },

  // Bodø to Stamsund (crossing to Lofoten)
  { slug: 'ytre-vestfjorden', name: 'Vestfjorden', nearPortOrder: 15 },

  // Svolvær area
  { slug: 'raftsundet', name: 'Raftsundet', nearPortOrder: 16 },
  { slug: 'trollfjord-575', name: 'Trollfjorden', nearPortOrder: 16 },
  { slug: 'østnesfjorden-565', name: 'Østnesfjorden', nearPortOrder: 16 },

  // Stokmarknes to Sortland
  { slug: 'hadselfjorden-572', name: 'Hadselfjorden', nearPortOrder: 17 },
  { slug: 'sortlandsundet-n', name: 'Sortlandsundet', nearPortOrder: 18 },

  // Risøyhamn to Harstad
  { slug: 'andfjord', name: 'Andfjorden', nearPortOrder: 19 },
  { slug: 'vaagsfjord', name: 'Vågsfjorden', nearPortOrder: 20 },
  { slug: 'kvæfjord', name: 'Kvæfjorden', nearPortOrder: 20 },

  // Harstad to Finnsnes
  { slug: 'solbergfjord', name: 'Solbergfjorden', nearPortOrder: 21 },
  { slug: 'gisund', name: 'Gisundet', nearPortOrder: 21 },

  // Finnsnes to Tromsø
  { slug: 'malangen', name: 'Malangen', nearPortOrder: 22 },
  { slug: 'grøtsundet', name: 'Grøtsundet', nearPortOrder: 22 },
  { slug: 'tromsøysund', name: 'Tromsøysundet', nearPortOrder: 22 },

  // Tromsø to Skjervøy
  { slug: 'lyngenfjorden', name: 'Lyngenfjorden', nearPortOrder: 23 },
  { slug: 'ullsfjord', name: 'Ullsfjorden', nearPortOrder: 23 },

  // Skjervøy to Øksfjord
  { slug: 'kvænangen-1', name: 'Kvænangen', nearPortOrder: 24 },
  { slug: 'øksfjord', name: 'Øksfjorden', nearPortOrder: 24 },

  // Øksfjord to Hammerfest
  { slug: 'altafjorden', name: 'Altafjorden', nearPortOrder: 25 },
  { slug: 'sørøysundet', name: 'Sørøysundet', nearPortOrder: 25 },

  // Honningsvåg to Kjøllefjord
  { slug: 'porsangen', name: 'Porsangerfjorden', nearPortOrder: 27 },
  { slug: 'laksefjord', name: 'Laksefjorden', nearPortOrder: 28 },

  // Mehamn to Berlevåg
  { slug: 'tanafjord', name: 'Tanafjorden', nearPortOrder: 29 },
  { slug: 'kongsfjorden', name: 'Kongsfjorden', nearPortOrder: 30 },

  // Vardø to Kirkenes
  { slug: 'varangerfjorden', name: 'Varangerfjorden', nearPortOrder: 32 },
  { slug: 'bøkefjorden', name: 'Bøkfjorden', nearPortOrder: 34 },
]
