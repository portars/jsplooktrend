package util;


public class getjson {
	public static String getJson() {
		WebRequest wr=new WebRequest();
		
		String result="test";
		try {
			result = wr.getMethod("http://hawttrends.appspot.com/api/terms/", "");
			wr.close();
//			result+="\r\n";
//			result+=wr.getMethod("http://apis.daum.net/socialpick/search", "output=json&n=20");
//			wr.close();
		} catch (Exception e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
			return e.getMessage();
		}
		
		return result;
	}
}
