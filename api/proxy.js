// api/proxy.js
export default async function handler(req, res) {
    // Vercel 환경변수에서 가져온 API 키
    const SERVICE_KEY = process.env.SERVICE_KEY; 
    
    // 사용자가 보낸 쿼리 스트링(pageNo 등)을 그대로 전달
    const { pageNo = 1, numOfRows = 100 } = req.query;
    
    const url = `https://api.data.go.kr/openapi/service/rest/BikeService/getBikeRentalStationList?serviceKey=${SERVICE_KEY}&pageNo=${pageNo}&numOfRows=${numOfRows}&type=xml`;
  
    try {
      const response = await fetch(url);
      const data = await response.text(); // 공공데이터는 주로 XML을 주므로 text로 받음
      
      // 브라우저에 결과 전달 (CORS 해결)
      res.setHeader('Content-Type', 'text/xml');
      res.status(200).send(data);
    } catch (error) {
      res.status(500).json({ error: 'Proxy 호출 중 오류 발생' });
    }
  }