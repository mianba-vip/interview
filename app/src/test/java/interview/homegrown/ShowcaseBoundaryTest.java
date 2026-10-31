package interview.homegrown;
import interview.homegrown.common.exception.GlobalExceptionHandler;
import interview.homegrown.common.web.ShowcaseController;
import interview.homegrown.modules.corpus.web.CorpusExampleController;
import interview.homegrown.modules.drill.service.UnavailableDrillService;
import interview.homegrown.modules.drill.web.DrillController;
import interview.homegrown.modules.studyplan.service.UnavailableStudyPlanService;
import interview.homegrown.modules.studyplan.web.StudyPlanController;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
class ShowcaseBoundaryTest {
    private MockMvc mvc;
    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.standaloneSetup(new ShowcaseController(), new CorpusExampleController(),
                new StudyPlanController(new UnavailableStudyPlanService()),
                new DrillController(new UnavailableDrillService()))
                .setControllerAdvice(new GlobalExceptionHandler()).build();
    }
    @Test
    void learningCoreCannotRunInPublicEdition() throws Exception {
        mvc.perform(post("/api/study-plans").contentType(MediaType.APPLICATION_JSON)
                .content("{\"goal\":\"sample\"}"))
                .andExpect(status().isNotImplemented()).andExpect(jsonPath("$.code").value(501));
    }
    @Test
    void drillCoreCannotRunInPublicEdition() throws Exception {
        mvc.perform(post("/api/drill/runs").contentType(MediaType.APPLICATION_JSON)
                .content("{\"topic\":\"sample\"}"))
                .andExpect(status().isNotImplemented()).andExpect(jsonPath("$.code").value(501));
    }
    @Test
    void editionAndFakeDataAreExplicit() throws Exception {
        mvc.perform(get("/api/showcase")).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.coreAvailable").value(false));
        mvc.perform(get("/api/corpus/examples")).andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].sourceType").value("EXAMPLE"))
                .andExpect(jsonPath("$.data[0].hasOriginal").value(false));
    }
}
