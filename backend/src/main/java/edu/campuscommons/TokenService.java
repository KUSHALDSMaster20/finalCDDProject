package edu.campuscommons;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;

@Component
public class TokenService {
    @Value("${app.jwt.secret}") private String secret;
    private String sign(String value) {
        try { Mac mac = Mac.getInstance("HmacSHA256"); mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256")); return Base64.getUrlEncoder().withoutPadding().encodeToString(mac.doFinal(value.getBytes(StandardCharsets.UTF_8))); }
        catch (Exception e) { throw new IllegalStateException(e); }
    }
    public String issue(long id, String role) {
        String header = Base64.getUrlEncoder().withoutPadding().encodeToString("{\"alg\":\"HS256\",\"typ\":\"JWT\"}".getBytes(StandardCharsets.UTF_8));
        String payload = Base64.getUrlEncoder().withoutPadding().encodeToString(("{\"sub\":\""+id+"\",\"role\":\""+role+"\",\"exp\":"+(Instant.now().getEpochSecond()+43200)+"}").getBytes(StandardCharsets.UTF_8));
        return header+"."+payload+"."+sign(header+"."+payload);
    }
    public Claims verify(String token) {
        try {
            String[] parts=token.split("\\."); if(parts.length!=3 || !java.security.MessageDigest.isEqual(sign(parts[0]+"."+parts[1]).getBytes(StandardCharsets.UTF_8),parts[2].getBytes(StandardCharsets.UTF_8))) return null;
            String json=new String(Base64.getUrlDecoder().decode(parts[1]),StandardCharsets.UTF_8);
            long id=Long.parseLong(json.replaceAll(".*\\\"sub\\\":\\\"(\\d+)\\\".*","$1"));
            String role=json.replaceAll(".*\\\"role\\\":\\\"([^\\\"]+)\\\".*","$1");
            long exp=Long.parseLong(json.replaceAll(".*\\\"exp\\\":(\\d+).*","$1"));
            return exp>Instant.now().getEpochSecond()?new Claims(id,role):null;
        } catch(Exception e) { return null; }
    }
    public record Claims(long id,String role) {}
}
