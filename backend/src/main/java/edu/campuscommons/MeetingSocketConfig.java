package edu.campuscommons;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.socket.*;
import org.springframework.web.socket.config.annotation.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Configuration
@EnableWebSocket
public class MeetingSocketConfig implements WebSocketConfigurer {
    private final Relay relay;
    @Value("${app.cors.origin}") private String origin;
    public MeetingSocketConfig(TokenService tokens, JdbcTemplate db){this.relay=new Relay(tokens,db);}
    @Override public void registerWebSocketHandlers(WebSocketHandlerRegistry registry){registry.addHandler(relay,"/ws/meeting/*").setAllowedOrigins(origin);}
    static class Relay extends TextWebSocketHandler {
        private final Map<String,Map<String,WebSocketSession>> rooms=new ConcurrentHashMap<>();
        private final ObjectMapper json=new ObjectMapper();
        private final TokenService tokens; private final JdbcTemplate db;
        Relay(TokenService tokens,JdbcTemplate db){this.tokens=tokens;this.db=db;}
        private String room(WebSocketSession s){String path=s.getUri()==null?"room":s.getUri().getPath();String[] p=path.split("/");return p.length>0?p[p.length-1]:"room";}
        private void send(WebSocketSession session,Map<String,Object> message)throws Exception{if(session.isOpen())session.sendMessage(new TextMessage(json.writeValueAsString(message)));}
        @Override public void afterConnectionEstablished(WebSocketSession s)throws Exception{
            String r=room(s),id=UUID.randomUUID().toString();s.getAttributes().put("room",r);s.getAttributes().put("peerId",id);
            String query=s.getUri()==null?"":s.getUri().getQuery();String token=query==null?"":Arrays.stream(query.split("&")).filter(x->x.startsWith("token=")).map(x->{try{return java.net.URLDecoder.decode(x.substring(6),java.nio.charset.StandardCharsets.UTF_8);}catch(Exception e){return "";}}).findFirst().orElse("");
            TokenService.Claims claims=tokens.verify(token);Integer known=db.queryForObject("SELECT (SELECT COUNT(*) FROM course_classes WHERE meeting_code=?)+(SELECT COUNT(*) FROM meetings WHERE meeting_code=?)",Integer.class,r,r);
            if(claims==null||known==null||known==0){s.close(CloseStatus.NOT_ACCEPTABLE.withReason("Valid sign-in and room invitation required"));return;}
            Map<String,WebSocketSession> peers=rooms.computeIfAbsent(r,k->new ConcurrentHashMap<>());List<String> existing=new ArrayList<>(peers.keySet());peers.put(id,s);
            if(existing.size()>=7){s.close(CloseStatus.SERVICE_RESTARTED.withReason("This room is full"));return;}
            send(s,Map.of("type","joined","id",id,"peers",existing));
            for(WebSocketSession peer:peers.values())if(peer!=s)send(peer,Map.of("type","peer-joined","id",id));
        }
        @Override protected void handleTextMessage(WebSocketSession s,TextMessage message)throws Exception{
            Map<String,Object> data=json.readValue(message.getPayload(),Map.class);String r=(String)s.getAttributes().get("room"),from=(String)s.getAttributes().get("peerId");data.put("from",from);Map<String,WebSocketSession> peers=rooms.getOrDefault(r,Map.of());
            Object to=data.get("to");if(to instanceof String id){WebSocketSession target=peers.get(id);if(target!=null)send(target,data);}else for(WebSocketSession peer:peers.values())if(peer!=s)send(peer,data);
        }
        @Override public void afterConnectionClosed(WebSocketSession s,CloseStatus status)throws Exception{
            String r=(String)s.getAttributes().get("room"),id=(String)s.getAttributes().get("peerId");Map<String,WebSocketSession> peers=rooms.get(r);if(peers!=null){peers.remove(id);for(WebSocketSession peer:peers.values())send(peer,Map.of("type","peer-left","id",id));if(peers.isEmpty())rooms.remove(r);}
        }
    }
}
