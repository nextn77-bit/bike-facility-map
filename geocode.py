import pandas as pd
import requests
import json
import time

API_KEY = "60DBDA18-75CF-37ED-93CF-97E51045A3FB"

df = pd.read_csv('대구광역시_자전거_공기주입기_20250101.csv', encoding='cp949')

results = []
for i, row in df.iterrows():
    addr = row['설치위치']
    # 괄호 안 내용 제거 (주소만 추출)
    import re
    clean_addr = re.sub(r'\(.*?\)', '', addr).strip()
    
    try:
        url = f"https://apis.vworld.kr/new2coord.do?q={requests.utils.quote(clean_addr)}&output=json&epsg=epsg:4326&apiKey={API_KEY}"
        res = requests.get(url, timeout=5)
        data = res.json()
        
        if data.get('result') == 'OK':
            x = float(data['point']['x'])
            y = float(data['point']['y'])
            results.append({
                'name': addr,
                'type': row['타입'],
                'tel': str(row['전화번호']),
                'lat': y,
                'lng': x
            })
            print(f"✅ {i+1}: {clean_addr} → {y}, {x}")
        else:
            print(f"❌ {i+1}: {clean_addr} → 실패")
    except Exception as e:
        print(f"❌ {i+1}: {clean_addr} → {e}")
    
    time.sleep(0.2)  # API 과부하 방지

with open('src/data/air_pumps.json', 'w', encoding='utf-8') as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

print(f"\n완료! {len(results)}/{len(df)} 개 변환됨")