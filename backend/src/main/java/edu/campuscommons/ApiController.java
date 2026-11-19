package edu.campuscommons;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestClient;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;

@RestController
@RequestMapping("/api")
public class ApiController {
    private final JdbcTemplate db; private final BCryptPasswordEncoder passwords; private final TokenService tokens; private final RestClient http=RestClient.create();
    @Value("${app.google.translate.key:}") private String translateKey;
    @Value("${app.libretranslate.url:http://localhost:5001}") private String libreTranslateUrl;
    @Value("${app.openai.api.key:}") private String openAiKey;
    @Value("${app.openai.model:gpt-4o-mini}") private String openAiModel;
    public ApiController(JdbcTemplate db, BCryptPasswordEncoder passwords, TokenService tokens) { this.db=db; this.passwords=passwords; this.tokens=tokens; }

    private TokenService.Claims claims(String authorization) {
        if(authorization==null || !authorization.startsWith("Bearer ")) throw new ApiError(401,"Please sign in to continue.");
        TokenService.Claims c=tokens.verify(authorization.substring(7)); if(c==null) throw new ApiError(401,"Your session expired. Please sign in again."); return c;
    }
    private void allow(TokenService.Claims c,String...roles) { if(Arrays.stream(roles).noneMatch(r->r.equals(c.role()))) throw new ApiError(403,"This feature is not available to your account type."); }
    private Map<String,Object> user(long id) { return db.queryForMap("SELECT id,name,email,role,campus_id AS campusId,COALESCE(department,'') AS department FROM users WHERE id=?",id); }
    private Map<String,Object> safeUser(Map<String,Object> row) { return Map.of("id",row.get("id"),"name",row.get("name"),"email",row.get("email"),"role",row.get("role"),"campusId",row.get("campusId"),"department",row.get("department")); }

    @GetMapping("/health") public Map<String,Object> health(){return Map.of("status","OK","service","Campus Commons Learning API","database","MySQL","backend","Java / Spring Boot");}
    @GetMapping("/config/features") public Map<String,Object> featureConfig(@RequestHeader(value="Authorization",required=false) String auth){TokenService.Claims c=claims(auth);allow(c,"student","teacher");boolean translationReady=!translateKey.isBlank()||translationServiceReady();return Map.of("translationConfigured",translationReady,"translationProvider",translateKey.isBlank()?"Self-hosted translator":"Google Cloud Translation","aiConfigured",!openAiKey.isBlank(),"assistantReady",true,"voiceSupported","browser");}
    private boolean translationServiceReady(){try{return http.get().uri(libreTranslateUrl+"/languages").retrieve().toBodilessEntity().getStatusCode().is2xxSuccessful();}catch(Exception e){return false;}}
    @PostMapping("/auth/register") public ResponseEntity<?> register(@RequestBody Map<String,String> b) {
        String name=trim(b.get("name")), email=trim(b.get("email")).toLowerCase(Locale.ROOT), pass=b.getOrDefault("password",""), role=trim(b.get("role")).toLowerCase(Locale.ROOT);
        if(role.equals("lecturer")) role="teacher";
        String campus=trim(b.get("campusId")); String department=trim(b.get("department"));
        if(name.isBlank()||name.length()>100||!email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")||email.length()>190) throw new ApiError(400,"Enter a name and valid email address.");
        if(!Set.of("student","teacher").contains(role)) throw new ApiError(400,"Choose Student or Faculty.");
        if(campus.isBlank()) campus=UUID.randomUUID().toString().substring(0,8).toUpperCase(Locale.ROOT);
        if(pass.length()<8||pass.length()>72) throw new ApiError(400,"Password must be between 8 and 72 characters.");
        if(role.equals("teacher")&&department.isBlank()) department="General";
        try { db.update("INSERT INTO users(name,email,password_hash,role,campus_id,department) VALUES(?,?,?,?,?,?)",name,email,passwords.encode(pass),role,campus,role.equals("teacher")?department:null); }
        catch(org.springframework.dao.DuplicateKeyException e){throw new ApiError(409,"An account with this email already exists.");}
        Map<String,Object> u=db.queryForMap("SELECT id,name,email,role,campus_id AS campusId,COALESCE(department,'') AS department FROM users WHERE email=?",email);
        return ResponseEntity.status(201).body(Map.of("token",tokens.issue(((Number)u.get("id")).longValue(),role),"user",u));
    }
    @PostMapping("/auth/login") public Map<String,Object> login(@RequestBody Map<String,String> b) {
        String email=trim(b.get("email")).toLowerCase(Locale.ROOT), role=trim(b.get("role")).toLowerCase(Locale.ROOT); if(role.equals("lecturer")) role="teacher";
        if(!Set.of("student","teacher").contains(role)) throw new ApiError(401,"Choose Student or Faculty to sign in.");
        List<Map<String,Object>> rows=db.queryForList("SELECT * FROM users WHERE email=?",email);
        if(rows.isEmpty()||!role.equals(rows.get(0).get("role"))||!passwords.matches(b.getOrDefault("password",""),(String)rows.get(0).get("password_hash"))) throw new ApiError(401,"Email, password, or account type did not match.");
        Map<String,Object> u=user(((Number)rows.get(0).get("id")).longValue()); return Map.of("token",tokens.issue(((Number)u.get("id")).longValue(),role),"user",u);
    }
    @GetMapping("/auth/me") public Map<String,Object> me(@RequestHeader(value="Authorization",required=false) String auth){TokenService.Claims c=claims(auth);allow(c,"student","teacher");return Map.of("user",user(c.id()));}


    private static final String RESOURCE_SELECT="SELECT r.*, borrower.name AS booked_by_name, owner.name AS created_by_name FROM resources r LEFT JOIN users borrower ON borrower.id=r.booked_by LEFT JOIN users owner ON owner.id=r.created_by";
    @GetMapping("/resources") public List<Map<String,Object>> resources(@RequestHeader(value="Authorization",required=false) String auth){TokenService.Claims c=claims(auth);allow(c,"student","teacher");return db.queryForList(RESOURCE_SELECT+" ORDER BY r.id");}
    @PostMapping("/resources") public ResponseEntity<?> addResource(@RequestHeader(value="Authorization",required=false) String auth,@RequestBody Map<String,String>b){
        TokenService.Claims c=claims(auth);allow(c,"teacher");String name=trim(b.get("name")),cat=trim(b.get("category"));
        if(name.isBlank()||name.length()>100||!Set.of("Lab Equipment","Study Room","Study Material").contains(cat))throw new ApiError(400,"Enter a name and choose a resource category.");
        db.update("INSERT INTO resources(name,category,created_by) VALUES(?,?,?)",name,cat,c.id()); long id=db.queryForObject("SELECT LAST_INSERT_ID()",Long.class);
        return ResponseEntity.status(201).body(db.queryForMap(RESOURCE_SELECT+" WHERE r.id=?",id));
    }
    @PostMapping("/resources/{id}/book") @Transactional public Map<String,Object> book(@RequestHeader(value="Authorization",required=false) String auth,@PathVariable long id){
        TokenService.Claims c=claims(auth);allow(c,"student");List<Map<String,Object>> rows=db.queryForList("SELECT * FROM resources WHERE id=? FOR UPDATE",id);
        if(rows.isEmpty())throw new ApiError(404,"Resource not found.");Map<String,Object> r=rows.get(0);String status=(String)r.get("status");
        if("Booked".equals(status)&&!Objects.equals(r.get("booked_by"),c.id()))throw new ApiError(409,"This resource is reserved by another student.");
        if("Available".equals(status))db.update("UPDATE resources SET status='Booked',booked_by=?,booked_at=NOW() WHERE id=?",c.id(),id);else db.update("UPDATE resources SET status='Available',booked_by=NULL,booked_at=NULL WHERE id=?",id);
        return db.queryForMap(RESOURCE_SELECT+" WHERE r.id=?",id);
    }

    @GetMapping("/classes") public List<Map<String,Object>> classes(@RequestHeader(value="Authorization",required=false) String auth){TokenService.Claims c=claims(auth);allow(c,"student","teacher");return db.queryForList("SELECT c.id,c.title,c.subject,c.starts_at AS startsAt,c.meeting_code AS meetingCode,u.name AS teacherName FROM course_classes c JOIN users u ON u.id=c.teacher_id ORDER BY c.starts_at");}
    @PostMapping("/classes") public ResponseEntity<?> createClass(@RequestHeader(value="Authorization",required=false) String auth,@RequestBody Map<String,String>b){TokenService.Claims c=claims(auth);allow(c,"teacher");String title=trim(b.get("title")), subject=trim(b.get("subject")), starts=trim(b.get("startsAt"));if(title.isBlank()||subject.isBlank()||starts.isBlank())throw new ApiError(400,"Enter a class title, subject, and start time.");String code=UUID.randomUUID().toString().substring(0,8);db.update("INSERT INTO course_classes(title,subject,teacher_id,starts_at,meeting_code) VALUES(?,?,?, ?,?)",title,subject,c.id(),starts.replace("T"," "),code);return ResponseEntity.status(201).body(Map.of("message","Online class scheduled","meetingCode",code));}
    @GetMapping("/meetings") public List<Map<String,Object>> meetings(@RequestHeader(value="Authorization",required=false) String auth){TokenService.Claims c=claims(auth);allow(c,"student","teacher");return db.queryForList("SELECT m.id,m.title,m.starts_at AS startsAt,m.meeting_code AS meetingCode,u.name AS hostName FROM meetings m JOIN users u ON u.id=m.host_id ORDER BY m.starts_at");}
    @PostMapping("/meetings") public ResponseEntity<?> createMeeting(@RequestHeader(value="Authorization",required=false) String auth,@RequestBody Map<String,String>b){TokenService.Claims c=claims(auth);allow(c,"teacher","student");String title=trim(b.get("title")),starts=trim(b.get("startsAt"));if(title.isBlank()||starts.isBlank())throw new ApiError(400,"Enter a meeting title and start time.");String code=UUID.randomUUID().toString().substring(0,8);db.update("INSERT INTO meetings(title,host_id,starts_at,meeting_code) VALUES(?,?,?,?)",title,c.id(),starts.replace("T"," "),code);return ResponseEntity.status(201).body(Map.of("message","Meeting scheduled","meetingCode",code));}

    @PostMapping("/assistant/chat") public Map<String,Object> assistant(@RequestHeader(value="Authorization",required=false) String auth,@RequestBody Map<String,Object>b){TokenService.Claims c=claims(auth);allow(c,"student","teacher");String q=trim((String)b.get("message"));if(q.isBlank())throw new ApiError(400,"Type or say a question first.");String answer;
        if(!openAiKey.isBlank()) { try { List<Map<String,String>> messages=new ArrayList<>();messages.add(Map.of("role","system","content","You are Campus Commons learning assistant. Be concise, helpful, and safe. Explain campus app features and learning concepts."));Object history=b.get("history");if(history instanceof List<?> turns)for(Object turn:turns){if(turn instanceof Map<?,?> m){Object role=m.get("role"),content=m.get("content");if(("user".equals(role)||"assistant".equals(role))&&content instanceof String s&&!s.isBlank())messages.add(Map.of("role",(String)role,"content",s.length()>4000?s.substring(0,4000):s));}}messages.add(Map.of("role","user","content",q));if(messages.size()>17)messages=new ArrayList<>(messages.subList(messages.size()-16,messages.size()));Map<?,?> response=http.post().uri("https://api.openai.com/v1/chat/completions").header("Authorization","Bearer "+openAiKey).contentType(MediaType.APPLICATION_JSON).body(Map.of("model",openAiModel,"messages",messages)).retrieve().body(Map.class);Map<?,?> choice=(Map<?,?>)((List<?>)response.get("choices")).get(0);answer=(String)((Map<?,?>)choice.get("message")).get("content");if(answer==null||answer.isBlank())throw new IllegalStateException("The AI provider returned an empty response."); } catch(Exception e){throw new ApiError(503,"AI assistant request failed. Check the OPENAI_API_KEY and OPENAI_MODEL settings, then restart the backend.");} }
        else answer=localAnswer(q);
        return Map.of("answer",answer,"mode",openAiKey.isBlank()?"built-in":"AI"); }
    private String localAnswer(String q){String s=q.toLowerCase(Locale.ROOT);if(s.contains("class")||s.contains("schedule"))return "Open Online Classes to see scheduled lessons, or ask a teacher to create a class. Select Join class to enter its video room.";if(s.contains("meeting")||s.contains("faculty")||s.contains("teacher"))return "Open Call Faculty to schedule a video conversation. Add a topic and time, then share the room code with the intended participants.";if(s.contains("translate")||s.contains("language"))return "Open Translator, type or paste your text, choose a target language, and select Translate text. The campus translator service handles the translation.";if(s.contains("reserve")||s.contains("resource"))return "Open the Resource Board, use search and category filters to find an item, then choose Reserve. Students can return their own reservations.";if(s.contains("study plan")||s.contains("study session")){String subject=q.replaceAll("(?i).*?(?:for|about|on)\\s+","").replaceAll("[?.!]$","").trim();if(subject.isBlank()||subject.equalsIgnoreCase(q))subject="your subject";return "Try this 30-minute plan for "+subject+": 5 min review what you know, 15 min work through one example or reading, 5 min explain the idea from memory, and 5 min check what to revisit. Take a short break afterward.";}if(s.contains("explain")||s.contains("what is")||s.contains("how does"))return "I can help break that down. Share the subject and the specific term, question, or example, and I’ll give you a focused explanation or a step-by-step way to work through it.";if(s.contains("homework")||s.contains("quiz")||s.contains("practice"))return "Tell me the subject, topic, and difficulty you want. I can help outline the steps, make a revision plan, or create practice questions.";return "Hi! I’m your Campus Commons learning assistant. I can guide you through online classes, Call Faculty, resource reservations, translations, study plans, and learning questions. What subject or task are you working on?";}
    @PostMapping("/translate") public Map<String,Object> translate(@RequestHeader(value="Authorization",required=false) String auth,@RequestBody Map<String,String>b){TokenService.Claims c=claims(auth);allow(c,"student","teacher");String text=trim(b.get("text")),target=trim(b.get("targetLanguage")),source=trim(b.get("sourceLanguage"));if(text.isBlank()||target.isBlank())throw new ApiError(400,"Enter text and choose a target language.");if(text.length()>4000)throw new ApiError(400,"Text must be 4,000 characters or fewer.");Map<String,Object> payload=new HashMap<>();payload.put("q",text);payload.put("target",target);String from=source.isBlank()?"auto":source;try{if(!translateKey.isBlank()){if(!from.equalsIgnoreCase("auto"))payload.put("source",from);Map<?,?> result=http.post().uri("https://translation.googleapis.com/language/translate/v2?key="+translateKey).contentType(MediaType.APPLICATION_JSON).body(payload).retrieve().body(Map.class);Map<?,?> data=(Map<?,?>)result.get("data");Map<?,?> translation=(Map<?,?>)((List<?>)data.get("translations")).get(0);return Map.of("translatedText",translation.get("translatedText"),"provider","Google Cloud Translation");}payload.put("source",from);Map<?,?> result=http.post().uri(libreTranslateUrl+"/translate").contentType(MediaType.APPLICATION_JSON).body(payload).retrieve().body(Map.class);return Map.of("translatedText",result.get("translatedText"),"provider","Self-hosted translator");}catch(Exception e){throw new ApiError(503,"Translation failed. Check that LibreTranslate is running and that its language models are loaded.");}}
    private String trim(String s){return s==null?"":s.trim();}
    @ExceptionHandler(ApiError.class) ResponseEntity<?> apiError(ApiError e){return ResponseEntity.status(e.status).body(Map.of("error",e.getMessage()));}
    static class ApiError extends RuntimeException {final int status;ApiError(int status,String message){super(message);this.status=status;}}
}
