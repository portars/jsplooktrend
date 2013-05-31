package util;



import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
public class WebRequest {
	private HttpURLConnection urlConn = null;
	private URL url;
	
	private InputStream resultStream;
	public InputStream getResultStream() {
		return resultStream;
	}
	
	public String getMethod(String string_url, String context) throws Exception {
		int responeseCode = 0;
		url = new URL(string_url + "?" + context);
		urlConn = (HttpURLConnection) url.openConnection();
		urlConn.setRequestMethod("GET");
		urlConn.setDoInput(true);
		urlConn.setDoOutput(false);
		
		responeseCode = urlConn.getResponseCode();
		System.out.println(string_url + "?" + context);
		if (responeseCode == 200) {
			resultStream =urlConn.getInputStream(); 
		} else {
			resultStream =urlConn.getErrorStream(); 
		}
		StringBuilder sb=new StringBuilder();
		
		BufferedReader r = new BufferedReader(new InputStreamReader(resultStream));
		String str="";
		while((str=r.readLine())!=null)
		{
			sb.append(str);
			
		}
		return sb.toString();
	}
	public void close(){
		if(urlConn!=null)
		{
			urlConn.disconnect();
			urlConn = null;
		}
	}
}
