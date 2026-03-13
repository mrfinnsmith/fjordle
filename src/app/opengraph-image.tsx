import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Fjordle — Gjett en fjord hver dag'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// The fjord outline path from Blefjord SVG (simplified for OG)
const FJORD_PATH = 'M 101.2,228.5 L 101.3,223.5 L 101.6,220.2 L 102.8,218.3 L 107.6,210.7 L 109.6,209.2 L 108.6,207.7 L 109.7,206.3 L 109.3,205.2 L 109.9,204.2 L 108.6,203.7 L 108.4,202.5 L 110.0,201.5 L 109.5,200.4 L 108.9,199.1 L 106.1,198.0 L 107.7,197.2 L 105.6,196.6 L 105.5,195.8 L 106.4,194.9 L 105.1,193.4 L 102.6,192.5 L 103.0,190.9 L 101.0,189.5 L 100.4,188.2 L 102.5,186.5 L 103.7,184.7 L 103.2,182.8 L 102.3,181.0 L 104.2,180.5 L 104.0,178.9 L 104.3,176.1 L 105.7,173.7 L 107.2,172.4 L 106.2,169.8 L 104.6,166.8 L 101.0,164.3 L 98.9,163.7 L 99.6,161.1 L 96.1,159.2 L 92.0,158.1 L 91.0,157.0 L 88.4,155.8 L 89.4,154.3 L 87.8,154.3 L 87.2,152.8 L 85.6,153.2 L 85.5,151.6 L 84.7,150.1 L 86.7,149.0 L 85.8,147.6 L 83.5,147.6 L 81.1,147.1 L 82.5,145.6 L 82.1,144.8 L 84.2,143.8 L 83.1,142.1 L 83.6,140.2 L 82.9,138.2 L 80.6,137.4 L 78.1,137.3 L 77.2,135.4 L 78.0,134.0 L 75.7,134.6 L 74.7,131.8 L 74.3,129.5 L 72.5,128.5 L 70.1,126.6 L 69.6,124.9 L 69.8,121.8 L 71.5,121.1 L 73.5,122.4 L 74.3,121.6 L 70.2,118.9 L 71.2,117.7 L 71.0,116.2 L 72.3,113.5 L 74.6,114.2 L 74.8,112.9 L 73.2,111.5 L 72.7,109.7 L 75.3,106.3 L 76.8,102.8 L 76.9,101.4 L 75.0,100.8 L 76.8,99.6 L 75.3,98.0 L 74.2,94.6 L 74.8,92.2 L 74.7,89.7 L 77.8,87.8 L 76.0,84.6 L 295.6,40.1 L 296.3,44.2 L 299.5,44.9 L 297.0,46.6 L 300.6,46.1 L 299.8,49.1 L 300.0,50.3 L 298.1,51.2 L 300.5,52.6 L 303.4,52.2 L 305.6,54.2 L 309.3,56.7 L 314.0,61.2 L 314.2,62.8 L 312.3,63.2 L 314.4,64.9 L 313.4,66.4 L 312.1,66.5 L 312.3,68.5 L 310.4,69.9 L 306.8,71.6 L 308.0,72.9 L 307.3,75.2 L 304.8,76.7 L 304.8,80.0 L 303.4,81.6 L 301.9,83.7 L 303.0,85.3 L 301.4,86.9 L 297.4,86.8 L 296.5,88.2 L 296.2,89.9 L 299.0,93.1 L 301.6,95.1 L 305.6,97.8 L 310.5,98.1 L 309.8,99.0 L 311.1,101.8 L 321.4,108.2 L 322.6,111.1 L 322.6,112.5 L 318.7,112.7 L 317.1,114.2 L 318.0,115.5 L 319.9,118.7 L 316.7,119.2 L 317.4,120.7 L 315.5,122.3 L 312.6,123.1 L 313.6,124.8 L 314.2,127.5 L 311.4,127.9 L 309.6,129.1 L 305.9,128.9 L 302.3,131.0 L 302.1,133.1 L 297.2,132.8 L 295.0,134.0 L 296.8,135.4 L 295.0,136.2 L 294.7,138.2 L 295.8,139.4 L 294.5,141.4 L 295.2,143.5 L 296.1,144.8 L 291.0,144.9 L 288.9,145.2 L 291.2,147.4 L 289.4,149.2 L 289.6,150.8 L 287.5,152.8 L 282.4,155.4 L 276.9,156.9 L 276.7,158.3 L 264.0,157.0 L 261.7,158.4 L 262.4,160.5 L 260.8,162.7 L 261.3,163.6 L 260.1,164.7 L 260.7,167.4 L 261.8,169.7 L 261.6,171.5 L 259.8,173.7 L 259.1,176.0 L 256.9,177.2 L 256.0,179.6 L 253.7,181.2 L 254.4,183.4 L 253.5,184.6 L 244.2,178.8 L 236.1,177.9 L 231.1,176.7 L 226.6,176.5 L 217.8,178.3 L 214.7,180.6 L 216.0,182.2 L 214.9,183.3 L 216.2,185.2 L 217.4,188.1 L 222.3,190.6 L 228.5,188.9 L 231.2,190.1 L 229.8,192.4 L 228.5,195.0 L 225.5,197.3 L 228.1,199.7 L 233.7,202.2 L 241.3,202.6 L 253.1,202.8 L 257.1,205.7 L 259.9,209.4 L 258.9,211.7 L 254.9,214.3 L 256.9,216.7 L 259.5,217.1 L 261.7,220.1 L 261.3,222.1 L 259.6,224.2 L 262.3,226.5 L 264.9,228.5 L 266.2,230.1 L 265.9,231.8 L 264.2,233.1 L 267.4,235.6 L 266.5,237.4 L 267.0,238.7 L 270.9,239.7 L 276.5,242.0 L 283.7,246.7 L 283.6,248.1 L 281.5,250.0 L 284.2,253.2 L 283.6,254.3 L 277.2,255.4 L 273.5,255.2 L 270.9,255.5 L 267.7,255.7 L 266.2,256.1 L 264.1,256.7 L 264.6,258.7 L 263.6,259.3 L 261.2,260.0 L 261.3,262.0 L 258.7,263.2 L 259.5,265.1 L 260.5,267.3 L 267.2,271.0 L 272.5,274.6 L 280.3,278.0 L 281.1,279.2 L 280.2,280.3 L 286.0,281.9 L 296.8,280.8 L 306.9,281.2 L 323.8,285.7 L 330.4,287.2 L 330.2,289.6 L 318.6,290.5 L 313.5,292.5 L 317.7,292.7 L 318.0,294.7 L 316.7,296.2 L 314.7,297.9 L 316.9,299.1 L 315.1,300.0 L 321.6,302.8 L 321.4,304.0 L 324.6,305.7 L 322.4,308.5 L 316.3,307.0 L 309.5,304.8 L 302.8,302.5 L 294.2,301.0 L 293.9,303.3 L 290.5,304.9 L 292.4,306.1 L 297.5,309.7 L 301.9,312.2 L 301.1,313.1 L 306.4,315.2 L 302.9,317.4 L 291.7,320.3 L 288.4,323.9 L 282.5,324.4 L 272.7,325.5 L 261.1,325.9 L 255.3,328.9 L 255.5,330.2 L 259.9,333.1 L 266.4,338.1 L 276.4,338.9 L 278.9,342.1 L 275.7,347.8 L 273.3,355.6 L 270.3,358.4 L 268.1,357.8 L 264.7,359.6 L 256.4,358.7 L 250.5,352.5 L 248.5,347.4 L 245.4,341.2 L 249.1,338.6 L 248.3,335.7 L 249.2,333.1 L 251.1,329.8 L 242.5,329.0 L 234.4,327.4 L 226.3,326.5 L 219.3,324.0 L 209.5,323.3 L 201.2,318.9 L 199.9,314.7 L 200.0,311.7 L 197.1,306.6 L 185.2,300.1 L 179.4,293.1 L 180.6,290.5 L 178.0,288.7 L 172.1,287.4 L 169.0,283.5 L 167.7,280.7 L 163.5,276.7 L 155.3,269.0 L 150.1,265.0 L 147.8,260.6 L 149.8,259.4 L 149.4,258.1 L 150.9,256.1 L 156.8,257.7 L 158.2,256.3 L 158.3,254.5 L 160.4,251.9 L 165.3,250.0 L 174.1,251.3 L 181.9,252.1 L 184.6,251.8 L 186.3,250.0 L 184.8,247.7 L 184.3,243.2 L 177.8,238.8 L 174.2,239.0 L 170.9,237.2 L 168.5,232.6 L 163.0,230.2 L 160.3,228.6 L 156.0,226.0 L 152.3,222.3 L 149.7,221.3 L 147.2,221.4 L 149.9,218.9 L 146.4,216.0 L 143.5,216.9 L 141.9,216.0 L 137.1,214.0 L 134.5,214.2 L 132.0,213.5 L 128.4,213.5 L 127.2,214.9 L 124.4,212.2 L 121.1,212.8 L 119.2,216.6 L 120.8,219.6 L 123.5,221.5 L 121.9,222.1 L 123.0,224.3 L 126.2,226.8 L 130.0,229.9 L 128.9,234.0 L 120.2,240.2 L 115.0,240.8 L 113.6,239.3 L 112.5,242.3 L 109.1,244.1 L 105.2,240.5 L 102.8,234.9 L 101.6,229.8'

export default async function Image() {
  const [oswaldData, workSansData] = await Promise.all([
    fetch(
      'https://fonts.gstatic.com/s/oswald/v53/TK3_WkUHHAIjg75cFRf3bXL8LICs1_FvsUZiYA.ttf'
    ).then((res) => res.arrayBuffer()),
    fetch(
      'https://fonts.gstatic.com/s/worksans/v19/QGY_z_wNahGAdqQ43RhVcIgYT2Xz5u32K0nXNig.ttf'
    ).then((res) => res.arrayBuffer()),
  ])

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#f4f1ec',
          display: 'flex',
          position: 'relative',
        }}
      >
        {/* Left content */}
        <div
          style={{
            flex: 1,
            padding: '64px 0 48px 72px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              fontFamily: 'Oswald',
              fontWeight: 700,
              fontSize: 96,
              textTransform: 'uppercase',
              letterSpacing: 2,
              color: '#00205B',
              lineHeight: 1,
            }}
          >
            Fjordle
          </div>
          <div
            style={{
              fontFamily: 'Work Sans',
              fontSize: 26,
              fontStyle: 'italic',
              color: '#BA0C2F',
              marginTop: 6,
            }}
          >
            Gjett en fjord hver dag
          </div>

          {/* Red divider */}
          <div
            style={{
              width: 64,
              height: 4,
              background: '#BA0C2F',
              borderRadius: 2,
              marginTop: 32,
              marginBottom: 32,
            }}
          />

          {/* Bullet points */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              'Kjenner du igjen omrisset?',
              '6 forsøk, avstand og retning som ledetråd',
              'Ny fjord hver dag',
            ].map((text) => (
              <div
                key={text}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: '#BA0C2F',
                    flexShrink: 0,
                  }}
                />
                <div
                  style={{
                    fontFamily: 'Work Sans',
                    fontSize: 19,
                    fontWeight: 500,
                    color: '#00205B',
                  }}
                >
                  {text}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: fjord outline */}
        <div
          style={{
            width: 480,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          <svg
            width="460"
            height="460"
            viewBox="0 0 400 400"
            style={{
              position: 'absolute',
              right: -30,
            }}
          >
            {/* Faint fill */}
            <path d={FJORD_PATH} fill="#BA0C2F" opacity="0.08" stroke="none" />
            {/* Stroke outline */}
            <path
              d={FJORD_PATH}
              fill="none"
              stroke="#BA0C2F"
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.85"
            />
          </svg>
        </div>

        {/* Footer rule */}
        <div
          style={{
            position: 'absolute',
            bottom: 52,
            left: 72,
            right: 72,
            height: 1.5,
            background: '#BA0C2F',
            opacity: 0.25,
          }}
        />

        {/* Footer left */}
        <div
          style={{
            position: 'absolute',
            bottom: 24,
            left: 72,
            fontFamily: 'Work Sans',
            fontSize: 15,
            fontWeight: 500,
            color: 'rgba(0,32,91,0.4)',
          }}
        >
          fjordle.lol
        </div>

        {/* Footer right */}
        <div
          style={{
            position: 'absolute',
            bottom: 24,
            right: 72,
            fontFamily: 'Work Sans',
            fontSize: 15,
            fontStyle: 'italic',
            color: '#BA0C2F',
            opacity: 0.7,
          }}
        >
          Ny fjord hver dag
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: 'Oswald',
          data: oswaldData,
          weight: 700,
          style: 'normal',
        },
        {
          name: 'Work Sans',
          data: workSansData,
          weight: 400,
          style: 'normal',
        },
      ],
    }
  )
}
