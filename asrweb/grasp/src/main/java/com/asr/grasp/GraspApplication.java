package com.asr.grasp;

import com.asr.grasp.controller.EmailController;
import com.asr.grasp.controller.SaveController;
import com.asr.grasp.controller.SeqController;
import com.asr.grasp.controller.TaxaController;
import com.asr.grasp.controller.TreeController;
import com.asr.grasp.objects.ASRObject;
import com.asr.grasp.controller.ReconstructionController;
import com.asr.grasp.controller.UserController;
import com.asr.grasp.objects.ReconstructionObject;
import com.asr.grasp.objects.UserObject;
import com.asr.grasp.objects.ShareObject;
import com.asr.grasp.utils.Defines;
import com.asr.grasp.utils.NaturalOrderComparator;
import com.asr.grasp.validator.LoginValidator;
import com.asr.grasp.validator.UserValidator;
import com.asr.grasp.view.AccountView;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;

import json.JSONArray;
import json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.web.support.SpringBootServletInitializer;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.context.annotation.SessionScope;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.ModelAndView;
import org.springframework.util.FileCopyUtils;
import javax.mail.internet.AddressException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.validation.Valid;
import java.io.IOException;
import java.util.logging.Level;
import java.util.logging.Logger;


@Controller
@SpringBootApplication
@SessionScope
public class GraspApplication extends SpringBootServletInitializer {

    private final static Logger logger = Logger.getLogger(GraspApplication.class.getName());

    @Value("${project.loggingdir}")
    private String loggingDir;

    private ASRThread recon = null;

    private boolean runningMarginal = false;

    @Autowired
    private UserValidator userValidator;

    @Autowired
    private AccountView accountView;

    @Autowired
    private LoginValidator loginValidator;

    @Autowired
    private UserController userController;

    @Autowired
    private ReconstructionController reconController;

    @Autowired
    private TaxaController taxaController;

    @Autowired
    private SeqController seqController;

    @Autowired
    private EmailController emailController;

    private SaveController saveController = null;

    @Autowired
    private TreeController treeController;

    @Override
    protected SpringApplicationBuilder configure(SpringApplicationBuilder application) {
        return application.sources(GraspApplication.class);
    }

    public static void main(String[] args) {
        SpringApplication.run(GraspApplication.class, args);
    }

    private UserObject loggedInUser = new UserObject();

    private ReconstructionObject currRecon = new ReconstructionObject();

    /**
     * ToDo: Will need to look into this as holding two instances for large recons won't work. HOWEVER, we shouldn't
     * be looking to do this for large reconstructions anyway- the user should be saving them first which would
     * mitigate these issues.
     */
    private ASRObject asr = new ASRObject();
    private ASRObject marginalAsr = new ASRObject();


    private boolean saveGappySeq = true;

    // A flag that keeps track of whether a reconstruction is currently being saved.
    private boolean isSaving = false;

    // Inputted email of the user - might be before they login
    private String email;

    // Keep track of the currently selected reconstructed nodes so that we can easily let the user
    // save them.
    private ArrayList<JSONObject> reconstructedNodes;

    // Again for downloading
    private JSONObject ancestor;
    private JSONObject msa;

    private boolean needToSave = false;

    @RequestMapping(value = "/register", method = RequestMethod.GET)
    public ModelAndView showRegistrationForm(WebRequest request, Model model) {
        model.addAttribute("user", loggedInUser);
        return new ModelAndView("register");
    }

    /**
     * Registers a new user account and sends the user to the accounts page.
     */
    @RequestMapping(value = "/register", method = RequestMethod.POST)
    public ModelAndView registerUser(@Valid @ModelAttribute("user") UserObject user,
            BindingResult bindingResult, Model model, HttpServletRequest request) throws AddressException {

        userValidator.validate(user, bindingResult);


        if (bindingResult.hasErrors()) {
            return new ModelAndView("register");
        }

        // Register the user
        String err = userController.register(user, userController.getAConfirmationToken());
        if (err != null) {
            bindingResult.rejectValue("username", "user.username.duplicate");

            return new ModelAndView("register");
        }

        // Send the confirmation email
        userController.sendRegistrationEmail(user);
        if (err != null) {
            // ToDo: Probably should add an error here
            return new ModelAndView("register");
        }

        loggedInUser = user;

        return new ModelAndView("confirm_registration");
    }

    /**
     * This is actually to logout. Here we want to reset the loggedInUser and also the current
     * reconstruction and ASR.
     */
    @RequestMapping(value = "/login", method = RequestMethod.GET)
    public ModelAndView logoutUserAndGoToLoginPage(WebRequest request, Model model) {
        // Reset our variables.
        loggedInUser = new UserObject();

        if (!needToSave) {
            currRecon = new ReconstructionObject();
            asr = new ASRObject();
        } else {
            needToSave = false;
        }

        model.addAttribute("user", loggedInUser);
        model.addAttribute("email", null);
        needToSave = false;
        return new ModelAndView("login");
    }


    /**
     * Logs in the user and takes them to their account page.
     */
    @RequestMapping(value = "/login", method = RequestMethod.POST)
    public ModelAndView loginUser(@Valid @ModelAttribute("user") UserObject user,
            BindingResult bindingResult, Model model, HttpServletRequest request) {

        loginValidator.validate(user, bindingResult);

        String err = userController.loginUser(user);
        if (err != null) {
            bindingResult.rejectValue("username", err);
        }
        if (bindingResult.hasErrors()) {
            return new ModelAndView("login");
        }

        loggedInUser = user;

        // ToDo: check the obsolete recons
        //reconController.checkObsolete();

        String errSave = null;
        Boolean saved = false;
        // If there is a current reconstruction save it.
        if (currRecon.getLabel() != null) {
            // Assume they input their email when they selected to save it.
            if (email != null) {
                loggedInUser.setEmail(email);
            } else {
                // ToDo: Fix this to ask for an email again.
                loggedInUser.setEmail("noemail");
            }
            errSave = saveCurrRecon();
            email = null;
            saved = true;
        }

        // Get their accounts page after we have saved the reconstruction (if
        // one existed).
        ModelAndView mav = accountView.get(loggedInUser, userController);

        // CHeck that err wasn't try
        if (errSave != null) {
            mav.addObject("warning", errSave);
        } else {
            mav.addObject("warning", null);
        }
        if (errSave == null && saved) {
            mav.addObject("type", "saved");
        }
        saveController = new SaveController();
        return mav;
    }

    /**
     * Registers a new user account and sends the user to the accounts page.
     *
     * Checks the confirmation token is correct.
     */
    @RequestMapping(value = "/confirm-registration", method = RequestMethod.GET)
    public ModelAndView confirmRegistration(Model model, HttpServletRequest request) {
        model.addAttribute("user", loggedInUser);
        return new ModelAndView("confirm_registration");
    }

    /**
     * Registers a new user account and sends the user to the accounts page.
     *
     * Checks the confirmation token is correct.
     */
    @RequestMapping(value = "/confirm-registration", method = RequestMethod.POST)
    public ModelAndView confirmRegistration(@Valid @ModelAttribute("user") UserObject user,
            BindingResult bindingResult, Model model, HttpServletRequest request) {

        String confirmed = userController.confirmRegistration(user);
        ModelAndView mav = new ModelAndView("confirm_registration");

        if (confirmed != null) {
            mav.addObject("warning", confirmed);
            return mav;
        }
        loggedInUser = user;
        model.addAttribute("user", loggedInUser);
        model.addAttribute("email", null);

        return new ModelAndView("set_password");
    }

    @RequestMapping(value = "/reset-password-confirmation", method = RequestMethod.GET)
    public ModelAndView resetPasswordConfirmation(Model model, HttpServletRequest request) {
        model.addAttribute("user", loggedInUser);
        return new ModelAndView("reset_password_confirmation");
    }

    @RequestMapping(value = "/reset-password-confirmation", method = RequestMethod.POST)
    public ModelAndView resetPasswordConfirmation(@Valid @ModelAttribute("user") UserObject user,
            BindingResult bindingResult, Model model, HttpServletRequest request) {
        model.addAttribute("user", loggedInUser);
        return new ModelAndView("reset_password_confirmation");
    }


    /**
     * Allows the user to set their password if they are already logged in or have provided
     * a correct login token.
     *
     * @param user
     * @param bindingResult
     * @param model
     * @param request
     * @return
     */
    @RequestMapping(value = "/set-password", method = RequestMethod.POST)
    public ModelAndView setPassword(@Valid @ModelAttribute("user") UserObject user,
            BindingResult bindingResult, Model model, HttpServletRequest request) {
        // ToDo: Check the obsolete recons
        //reconController.checkObsolete();
        user.setId(loggedInUser.getId());
        loggedInUser = user;
        String err = userController.setPassword(user);
        ModelAndView mav = new ModelAndView("set_password");
        if (err != null) {
            mav.addObject("warning", err);
            return mav;
        }
        loggedInUser = user;

        model.addAttribute("user", loggedInUser);
        model.addAttribute("email", null);
        // ToDo
        return new ModelAndView("login");
    }


    /**
     * @return
     */
    @RequestMapping(value = "/set-password", method = RequestMethod.GET)
    public ModelAndView setPassword(Model model, HttpServletRequest request) {
        // ToDo: Check the obsolete recons
        //reconController.checkObsolete();
        loggedInUser = new UserObject();
        // ToDo
        model.addAttribute("user", loggedInUser);
        model.addAttribute("email", null);
        return new ModelAndView("set_password");
    }

    /**
     * Sends the user a token for their account based on their email address.
     *
     * @param user
     * @param bindingResult
     * @param model
     * @param request
     * @return
     */
    @RequestMapping(value = "/forgot-password", method = RequestMethod.POST)
    public ModelAndView sendPasswordLink(@Valid @ModelAttribute("user") UserObject user,
            BindingResult bindingResult, Model model, HttpServletRequest request) throws AddressException {
        // ToDo: Check the obsolete recons
        //reconController.checkObsolete();
        loggedInUser = user;
        // ToDo
        String err = userController.sendForgotPasswordEmail(user);
        ModelAndView mav = new ModelAndView("forgot_password");
        if (err != null) {
            mav.addObject("warning", err);
            return mav;
        }
        return new ModelAndView("set_password");
    }

    /**
     * Sends the user a token for their account based on their email address.
     * @param model
     * @param request
     * @return
     */
    @RequestMapping(value = "/forgot-password", method = RequestMethod.GET)
    public ModelAndView sendPasswordLink(Model model, HttpServletRequest request) {
        return new ModelAndView("forgot_password");
    }


    /**
     * Returns the account page to the user.
     *
     * @param request
     * @param model
     * @return
     */
    @RequestMapping(value = "/account", method = RequestMethod.GET)
    public ModelAndView showAccount(WebRequest request, Model model) {
        // ToDo: Check the obsolete recons
        //reconController.checkObsolete();
        return accountView.get(loggedInUser, userController);
    }

    /**
     * Initialise the initial form in the index
     *
     * @return index html
     */
    @RequestMapping(value = "/", method = RequestMethod.GET)
    public ModelAndView showForm(Model model) {
        this.asr = new ASRObject();
        model.addAttribute("asrForm", this.asr);
        model.addAttribute("user", loggedInUser);
        model.addAttribute("username", loggedInUser.getUsername());
        model.addAttribute("email", loggedInUser.getEmail());

        return new ModelAndView("index");
    }


    @RequestMapping(value = "/", method = RequestMethod.GET, params = {"cancel"})
    public ModelAndView cancelRecon(WebRequest request, Model model) {
        if (recon != null) {
            recon.interrupt();
        }
        // Ensure we don't think any jobs are still running.
        runningMarginal = false;
        return showForm(model);

    }

    /**
     * Redirect to the inital form after user logs in via the login modal
     *
     * @return index html
     */
    @RequestMapping(value = "/", method = RequestMethod.POST)
    public ModelAndView afterModalLogin(Model model) {
        this.asr = new ASRObject();
        model.addAttribute("asrForm", this.asr);
        model.addAttribute("user", loggedInUser);
        model.addAttribute("username", loggedInUser.getUsername());
        model.addAttribute("email", loggedInUser.getEmail());


        return new ModelAndView("index");
    }

    /***
     * Removes a users access to a reconstruction so it no longer shows on their page.
     *
     * @return the view for the account page.
     */
    @RequestMapping(value = "/", method = RequestMethod.GET, params =
            {"remove", "id"})
    public ModelAndView remove(@RequestParam("remove") String delete,
            @RequestParam("id") int reconId, WebRequest
            webrequest, Model model) {

        ModelAndView mav = accountView.get(loggedInUser, userController);
        // Need to check if the users details were correct
        String err = reconController.removeSharedRecon(reconId, loggedInUser);

        if (err != null) {
            // This check is needed so as to not trigger an error when the page is reloaded after deletion
            if (err == Defines.DELETE_NOACCESS){
                return mav;
            }
            mav.addObject("warning", err);
            mav.addObject("message", "Unable to remove your access to the reconstruction, error: " + err);
        } else {
            mav.addObject("type", "removed");
            mav.addObject("warning", null);
            mav.addObject("message", "Successfully removed your access to the reconstruction.");
        }

        return mav;
    }

    /**
     * ToDo need to change to int reconId from long id. Deletes a reconstruction
     *
     * @return the view for the account page.
     */
    @RequestMapping(value = "/", method = RequestMethod.GET, params =
            {"delete", "id"})
    public ModelAndView deleteRecon(@RequestParam("delete") String delete,
            @RequestParam("id") int reconId, WebRequest
            webrequest, Model model) {

        ModelAndView mav = accountView.get(loggedInUser, userController);
        // Need to check if the users details were correct
        String err = reconController.delete(reconId, loggedInUser);

        if (err != null) {
            // This check is needed so as to not trigger an error when the page is reloaded after deletion
            if (err == Defines.DELETE_NOTOWNER){
                return mav;
            }
            mav.addObject("warning", err);
            mav.addObject("message", "Unable to delete the reconstruction, error: " + err);
        } else {
            mav.addObject("warning", "delete");
            mav.addObject("message", "Successfully deleted reconstruction. Refresh to see changes.");
        }

        return mav;
    }

    /**
     * Shares the reconsrtruction with another user by their username.
     *
     * ToDo: Need to look at what the shareObject was
     */
    @RequestMapping(value = "/", method = RequestMethod.POST, params = {"share"})
    public ModelAndView shareRecon(@RequestParam("share") String share,
            @ModelAttribute("share") ShareObject shareObject,
            BindingResult bindingResult, Model model, HttpServletRequest request) {
        ModelAndView mav = accountView.get(loggedInUser, userController);



        // ShareObject it with the user
        String err = reconController.shareWithUser(shareObject.getReconID(),
                shareObject.getUsername(), loggedInUser);

        if (err != null) {
            mav.addObject("warning", err);
            mav.addObject("message", "Cannot share reconstruction - " + err.toString());

        } else {
            mav.addObject("type", "shared");
            mav.addObject("warning", null);
        }

        return mav;
    }


    private ModelAndView loadRecon() {


        // Otherwise we want to set this for the user.
        userController.setCurrRecon(currRecon, loggedInUser);

        currRecon = loggedInUser.getCurrRecon();

        ModelAndView mav = new ModelAndView("index");

        mav.addObject("label", currRecon.getLabel());

        // add reconstructed newick string to send to javascript
        mav.addObject("tree", currRecon.getReconTree());

        // add msa and inferred ancestral graph
        String graphs = asr.catGraphJSONBuilder(new JSONObject(currRecon.getMsa()), new JSONObject(currRecon.getAncestor()));

        mav.addObject("graph", graphs);

        // add attribute to specify to view results (i.e. to show the graph, tree, etc)
        mav.addObject("inferenceType", currRecon.getInferenceType());
        mav.addObject("node", currRecon.getNode());
        mav.addObject("results", true);

        mav.addObject("user", loggedInUser);
        mav.addObject("username", loggedInUser.getUsername());
        mav.addObject("email", loggedInUser.getEmail());

        // Run reconstruction but first get the extent names so we can asynronously do a lookup with
        // NCBI to get the taxonomic iDs.
        // ToDo: add in the IDs
        JSONObject ids = taxaController.getNonExistIdsFromProtId(seqController.getSeqLabelAsNamedMap(currRecon.getId()));

        mav.addObject("ids", ids.toString());
        mav.addObject("saved", true);

        mav.addObject("jointLabels", seqController.getAllSeqLabels(currRecon.getId(), currRecon.getInferenceTypeInt()));
        // Add the ancestor to the list we don't need to check here for duplicates as this will be
        // the initial iteration.
        reconstructedNodes = new ArrayList<>();
        msa = new JSONObject(currRecon.getMsa());
        ancestor = new JSONObject(currRecon.getAncestor());
        return mav;
    }

    /**
     * Loads the reconstruction by an ID
     * @param id
     * @return
     */
    private ModelAndView loadReconById(int id) {
        // Here since we store the current reconsruction we just need to
        // update the reconstruction that it is pointing at.
        ReconstructionObject recon = reconController.getById(id,
                loggedInUser);

        // We want to return that the reconstruction doesn't exist if it
        // isn't in the db or the user doesn't have access
        if (recon == null) {
            return null;
        }
        currRecon = recon;
        return loadRecon();
    }

    /**
     * Loads the reconstruction by it's label, this is only allowed for those included in the public
     * domain.
     * @param label
     * @return
     */
    private ModelAndView loadReconByLabel(String label) {
        // Here since we store the current reconsruction we just need to
        // update the reconstruction that it is pointing at.
        ReconstructionObject recon = reconController.getByLabel(label);

        // We want to return that the reconstruction doesn't exist if it
        // isn't in the db or the user doesn't have access
        if (recon == null) {
            return null;
        }
        currRecon = recon;
        return loadRecon();
    }

    /**
     * Loads a reconstruction based on the ID. ID is the reconstruction ID.
     */
    @RequestMapping(value = "/", method = RequestMethod.GET, params = {"load", "id"})
    public ModelAndView loadRecon(@RequestParam("load") String load,
            @RequestParam("id") int id, WebRequest
            webrequest, Model model) {

        ModelAndView mav =  loadReconById(id);
        // We want to return that the reconstruction doesn't exist if it
        // isn't in the db or the user doesn't have access
        if (mav == null) {
            return showError(model);
        }

        return mav;
    }


    /**
     * Save the current reconstruction if there is a current reconstruction.
     *
     * This is called when a user registers (i.e. they may have just made a reconstruction) or logs
     * in.
     */
    public void saveCurrReconStartThread() {
        saveController = new SaveController(reconController, currRecon, userController, loggedInUser, emailController, seqController, treeController, saveGappySeq, true);

        saveController.setLoggingDir(loggingDir);

        saveController.initialiseForReconstruction(asr);

        saveController.start();

        // Remove the reference to the thread otherwise GC won't be able to clean it up.
        saveController = null;
    }


    /**
     * Save the current reconstruction if there is a current reconstruction.
     *
     * This is called when a user registers (i.e. they may have just made a reconstruction) or logs
     * in.
     */
    public String saveCurrRecon() {
        // The user may have just logged in so we need to update the
        // owner id
        currRecon.setOwnerId(loggedInUser.getId());

        String err = null;
        if (email != null) {
            saveCurrReconStartThread();
        } else {
            // Save the reconstruction
            err = reconController.save(loggedInUser, currRecon);

            int infType = currRecon.getInferenceTypeInt();

            // We also want to save all recons
            seqController.insertAllJointsToDb(currRecon.getId(), asr.getASRPOG(infType),
                    saveGappySeq, loggedInUser.getId());

            // Also want to save all the extents into the db
            seqController.insertAllExtantsToDb(currRecon.getId(), asr.getSequencesAsNamedMap(),
                    saveGappySeq);

        }
        return err;
    }


    /**
     * Show guide
     *
     * @return guide html
     */
    @RequestMapping(value = "/guide", method = RequestMethod.GET)
    public ModelAndView showGuide(Model model) {
        ModelAndView mav = new ModelAndView("guide");
        mav.addObject("results", asr.getLabel() != "");
        mav.addObject("user", loggedInUser);
        mav.addObject("username", loggedInUser.getUsername());
        return mav;
    }

    /**
     * Show workshop tutorial
     *
     * @return guide html
     */
    @RequestMapping(value = "/tutorial", method = RequestMethod.GET)
    public ModelAndView showTutorial(Model model) {
        ModelAndView mav = new ModelAndView("tutorial");
        mav.addObject("results", asr.getLabel() != "");
        mav.addObject("user", loggedInUser);
        mav.addObject("username", loggedInUser.getUsername());
        return mav;
    }

    /**
     * Show workshop tutorial
     *
     * @return guide html
     */
    @RequestMapping(value = "/tutorialtps", method = RequestMethod.GET)
    public ModelAndView showTutorialTps(Model model) {
        ModelAndView mav = new ModelAndView("tutorial_tps");
        mav.addObject("results", asr.getLabel() != "");
        mav.addObject("user", loggedInUser);
        mav.addObject("username", loggedInUser.getUsername());
        return mav;
    }


    /**
     * Show feature log
     *
     * @return feature log html
     */
    @RequestMapping(value = "/feature_log", method = RequestMethod.GET)
    public ModelAndView showFeatureLog(Model model) {
        ModelAndView mav = new ModelAndView("feature_log");
        mav.addObject("results", asr.getLabel() != "");
        mav.addObject("user", loggedInUser);
        mav.addObject("username", loggedInUser.getUsername());
        return mav;
    }

    /**
     * Show max likelihood info
     *
     * @return guide html
     */
    @RequestMapping(value = "/ml", method = RequestMethod.GET)
    public ModelAndView showMlInfo(Model model) {
        ModelAndView mav = new ModelAndView("ml");
        mav.addObject("results", asr.getLabel() != "");
        mav.addObject("user", loggedInUser);
        mav.addObject("username", loggedInUser.getUsername());
        return mav;
    }


    /**
     * Save reconstruction
     *
     * @return account html
     */
    @RequestMapping(value = "/save", method = RequestMethod.GET)
    public ModelAndView saveRecon(WebRequest request, Model model) throws IOException {
        // Saves the current reconstruction


        // if a user is not logged in, prompt to Login
        if (loggedInUser.getUsername() == null || loggedInUser.getUsername() == "") {
            ModelAndView mav = new ModelAndView("old_login");
            mav.addObject("user", loggedInUser);
            return mav;
        }

        // Save the reconstruction
        String err = saveCurrRecon();

        // Check if we were able to save it
        if (err != null) {
            // ToDo: Something
            return showError(model);
        }
        ModelAndView mav = accountView.get(loggedInUser, userController);

        mav.addObject("type", "saved");
        return mav;
    }

    /**
     * Show error
     *
     * @return index html
     */
    @RequestMapping(value = "/error", method = RequestMethod.GET)
    public ModelAndView showError(Model model) {
        ModelAndView mav = new ModelAndView("index");
        mav.addObject("asrForm", asr);
        mav.addObject("error", true);
        mav.addObject("errorMessage",
                "Sorry! An unknown error occurred. Please check the error types in the guide and retry your reconstruction... ");
        mav.addObject("username", loggedInUser.getUsername());
        return mav;
    }


    /**
     * Allows us to keep the marginal and the joint reconstruction separate.
     * @param status
     * @param asr
     * @return
     */
    public String getStatusFromAsr(String status, ASRObject asr) {
        try {
            if (status != null && (status.equalsIgnoreCase("done") || status.contains("error"))) {
                String stat = status;
                asr.setFirstPass(true); // reset flag
                asr.setPrevProgress(0);
                return stat;
            }

            // try to get current node ID
            int progress = asr.getNumberAlnCols() == 0 ? 0
                    : (100 * asr.getReconCurrentNodeId()) / asr.getNumberAlnCols();
            if (asr.getFirstPass() && progress < asr.getPrevProgress()) {
                asr.setFirstPass(false);
            }

            progress = asr.getFirstPass() ? progress / 2 : 50 + progress / 2;
            if (progress > asr.getPrevProgress()) {
                asr.setPrevProgress(progress);
            }

            return asr.getPrevProgress() + "%";
        } catch (Exception e) {
            System.out.println(e);
            return "";
        }
    }


    /**
     * Gets the taxonomic ids from the User side.
     * Returns
     * @param jsonString
     * @return
     */
    @RequestMapping(value = "/taxa" , method = RequestMethod.POST)
    public @ResponseBody String getTaxaInfo(@RequestBody String jsonString) {
        String err = verify();

        if (err != null) {
            return err;
        }

        JSONObject dataJson = new JSONObject(jsonString);
        // Check if we have anything to save
        if ((Boolean)dataJson.get("toSave") == true) {
            err = taxaController.insertTaxaIds(dataJson);
        }

        // Now we want to get the taxonomic information for all the IDs in this dataset.
        // ToDo: could be slightly optimised to use the IDs collected before.
        return taxaController.getTaxaInfoFromProtIds(seqController.getSeqLabelAsNamedMap(currRecon.getId())).toString();
    }

    /**
     * Gets a marginal reconstruction to add to the recon graph.
     *
     * Returns a JSON string representation of the consensus sequence
     * @param jsonString
     * @return
     */
    @RequestMapping(value = "/getmarginalrecon" , method = RequestMethod.POST)
    public @ResponseBody String getMarginalRecon(@RequestBody String jsonString) {

        JSONObject dataJson = new JSONObject(jsonString);
        marginalAsr.setInferenceType("marginal");

        if (dataJson.getString("nodeLabel").equals(null)) {
            return "err: You need to have a label.";
        }
        String nodeLabel = dataJson.getString("nodeLabel");
        String reconstructedAnsc = seqController.getInfAsJson(currRecon.getId(), nodeLabel, Defines.MARGINAL);


        if (reconstructedAnsc == null && runningMarginal != true) {
            runningMarginal = true;
            loadReconToASR();
            // Set the node label we want to infer.
            marginalAsr.setNodeLabel(nodeLabel);
            // Run the thread
            recon = new ASRThread(marginalAsr, "marginal", nodeLabel, false, logger, loggedInUser,
                    reconController);
            reconstructedAnsc = seqController.getInfAsJson(currRecon.getId(), nodeLabel, Defines.MARGINAL);
            return marginalAsr.catGraphJSONBuilder(new JSONObject(currRecon.getMsa()), new JSONObject(reconstructedAnsc));

        } else if (reconstructedAnsc == null && runningMarginal) {
            // Let the user know that the marginal reconstruction is still running.]
            System.out.println("Running marginal");
            return "running";

        } else {
            runningMarginal = false;
            // Return the reconstructed ancestors
            return marginalAsr.catGraphJSONBuilder(new JSONObject(currRecon.getMsa()), new JSONObject(reconstructedAnsc));
        }
    }

    /**
     * Gets a joint reconstruction to add to the recon graph.
     *
     * Returns a JSON string representation of the consensus sequence
     * @param jsonString
     * @return
     */
    @RequestMapping(value = "/getrecon" , method = RequestMethod.POST)
    public @ResponseBody String getRecon(@RequestBody String jsonString) {

        JSONObject dataJson = new JSONObject(jsonString);
        // Check if we have anything to save
        int reconMethod = Defines.JOINT;
        if ((Boolean)dataJson.get("joint") != true) {
            reconMethod = Defines.MARGINAL;
        }
        if (dataJson.getString("nodeLabel").equals(null)) {
            return "You need to have a label.";
        }

        String nodeLabel = dataJson.getString("nodeLabel");
        String reconstructedAnsc = seqController.getInfAsJson(currRecon.getId(), nodeLabel, reconMethod);

        if (reconstructedAnsc == null) {
            // This means we weren't able to find it in the DB so we need to run the recon as usual
            // If this recon has an ID i.e. the user has saved it before then save this recon.
            if (currRecon.getId() != Defines.UNINIT) {
                seqController.insertSeqIntoDb(currRecon.getId(), nodeLabel, asr.getASRPOG(reconMethod), loggedInUser.getId(), reconMethod, true);

            }
            reconstructedAnsc = seqController.getInfAsJson(currRecon.getId(), nodeLabel, reconMethod);

            return reconstructedAnsc;
        }

        // Here we want to update the one in the database so that we don't have to re-do this do for
        //return c.getAsJson().toString();

        // Add to the reconstructed ancestors for saving
        reconstructedNodes.add(new JSONObject(reconstructedAnsc));

        return reconstructedAnsc;
    }

    /**
     * A helper method that facilitates in the verification process.
     *
     * @return
     */
    private String verify() {
        // If there is no user logged in return that they need to log in and save a recon before
        // performing motif searching.
        if (loggedInUser == null) {
            return new JSONObject().put("error", "User must be logged in to perform this action.").toString();
        }
        // If they don't have a saved reconstruction return that they need to save the reconstruction
        if (currRecon.getId() == Defines.FALSE) {

            return "You need to save your reconstruction before performing this action." ;
        }
        // If their reconstruction is of old format then we want to tell them to re-perform the reconstruction
        if (!seqController.hasReconsAncestorsBeenSaved(currRecon.getId())) {
            return new JSONObject().put("error", "Apologies but you need to re-run your reconstruction as we've made a lot of changes to make this feature possible! Please re-run it (and save your reconstruction) and then this will be possible. Also please delete your old reconstruction so we have more space in our database, thank you :) ").toString();
        }
        return null;
    }

    /**
     * Checks if the reconstruction can be saved. Also checks if the user is currently saving a
     * recon, if they are then return that they have to wait until the other reconstruction
     * has been saved.
     *
     * Returns
     * @param jsonString
     * @return
     */
    @RequestMapping(value = "/saveRecon" , method = RequestMethod.POST)
    public @ResponseBody String saveCurrentRecon(@RequestBody String jsonString) {
        JSONObject dataJson = new JSONObject(jsonString);

        JSONObject returnVal = new JSONObject();
        /**
         * Only allow one reconstruction to be saved at a time.
         * ToDo: Batch these
         */
        if (saveController != null) {
            isSaving = saveController.getIsSaving();
        } else {
            isSaving = false;
        }
        if (isSaving) {
            return returnVal.put("value", "isSaving").toString();
        }
        email = dataJson.getString("email");


        // if a user is not logged in, prompt to Login
        if (loggedInUser.getUsername() == null || loggedInUser.getUsername().equals("")) {
            needToSave = true;
            return returnVal.put("value", "login").toString();
        }

        boolean reconstructedAnc = seqController.hasReconsAncestorsBeenSaved(currRecon.getId());

        if (reconstructedAnc){

            return returnVal.put("value", "exists").toString();

        }

        loggedInUser.setEmail(email);
        saveCurrReconStartThread();

        isSaving = true;
        return returnVal.toString();
    }


    /**
     * Gets the node ids that contain a certain motif. This updates the tree.
     *
     * Returns
     * @param jsonString
     * @return
     */
    @RequestMapping(value = "/motif" , method = RequestMethod.POST)
    public @ResponseBody String getAncestorsMatchingMotif(@RequestBody String jsonString) {

        String err = verify();
        if (err != null) {
            return err;
        }
        // Otherwise we're able to run it
        JSONObject dataJson = new JSONObject(jsonString);

        // Check for the motif
        String motif = dataJson.getString("motif");

        //Return the list of matching node ids as a json array
        return seqController
                .findAllWithMotifJSON(reconController.getUsersAccess(currRecon.getId(), loggedInUser), currRecon.getId(), motif).toString();
    }


    /**
     * Gets similar nodes between two reconstructed trees that a user has access to.
     *
     * Returns
     * @param jsonString
     * @return
     */
    @RequestMapping(value = "/getsimilarnode" , method = RequestMethod.POST)
    public @ResponseBody String getSimilarNodes(@RequestBody String jsonString) {
        String err = verify();
        if (err != null) {
            return err;
        }
        // Otherwise we're able to run it
        JSONObject data = new JSONObject(jsonString);


        if (data.getString("unknown").length() > 0 & data.getString("node").length() > 0 & data.getString("num").length() > 0 ) {
            JSONArray similarNodes = treeController.getSimilarNodes(loggedInUser, data.getString("unknown"), currRecon.getLabel(), data.getString("node"), data.getInt("num"));

            //Return the list of matching node ids as a json array
            return similarNodes.toString();
        }

        return new JSONObject().put("error", "Make sure you have filled out the reconstruction label, node label, and number of similar nodes fields correctly").toString();

    }

    /**
     * Helper function to set the current reconstruction.
     */
    public void setReconFromASR(ASRObject asr, JSONObject ancestor, JSONObject msa) {

        currRecon = reconController.createFromASR(asr);

        // Set the anscestor and the msa
        currRecon.setAncestor(ancestor.toString());
        currRecon.setMsa(msa.toString());


        reconstructedNodes = new ArrayList<>();
        this.ancestor = ancestor;
        this.msa = msa;

        // Set the owner ID to be the logged in user
        currRecon.setOwnerId(loggedInUser.getId());

        // Set the current reconstruction of the owner to be this reconstruction
        userController.setCurrRecon(currRecon, loggedInUser);
    }

    @RequestMapping(value = "/", method = RequestMethod.GET, params = {"getrecon"})
    public ModelAndView returnASR(Model model) {

        ModelAndView mav = new ModelAndView("index");

        // Here we need to update the reconstruction to have all the
        // parameters of the ASR.

        // Set some of the features that we'll need to be able to reconstruct
        // it correctly.
        JSONObject ancestorJson = asr.getAncestralGraphJSON(asr.getWorkingNodeLabel());
        JSONObject msaGraph = asr.getMSAGraphJSON();

        // Set the current reconstruction
        setReconFromASR(asr, ancestorJson, msaGraph);

        mav.addObject("label", asr.getLabel());

        // add reconstructed newick string to send to javascript
        mav.addObject("tree", asr.getReconstructedNewickString());

        // add msa and inferred ancestral graph
        String graphs = asr.catGraphJSONBuilder(msaGraph, ancestorJson);
        mav.addObject("graph", graphs);

        // add attribute to specify to view results (i.e. to show the graph, tree, etc)
        mav.addObject("inferenceType", asr.getInferenceType());
        mav.addObject("results", true);
        mav.addObject("node", asr.getNodeLabel());
        mav.addObject("username", loggedInUser.getUsername());
        mav.addObject("email", loggedInUser.getEmail());

        // Run reconstruction but first get the extent names so we can asynronously do a lookup with
        // NCBI to get the taxonomic iDs.
        JSONObject ids = new JSONObject();
        ArrayList<String> jointLabels = new ArrayList<>();
        try {
            ids = taxaController.getNonExistIdsFromProtId(seqController.getSeqLabelAsNamedMap(currRecon.getId()));
            jointLabels = seqController.getAllSeqLabels(currRecon.getId(), Defines.JOINT);
            if (jointLabels == null) {
                jointLabels = new ArrayList<>();
            }
        } catch (Exception e) {
            System.out.println(e);
        }
        mav.addObject("ids", ids.toString());
        mav.addObject("jointLabels", jointLabels);
        mav.addObject("saved", false);

        return mav;
    }



    /**
     * Submit the asr form (documenting input details, i.e. aln and tree file, etc)
     *
     * @param asrForm ASR object
     * @param bindingResult Form result, indicating any input errors
     * @param model com model
     * @return index with results as attributes in the model
     */
    @RequestMapping(value = "/", method = RequestMethod.POST, params = "submitAsr")
    public ModelAndView performReconstruction(@Valid @ModelAttribute("asrForm") ASRObject asrForm,
            BindingResult bindingResult, Model model, HttpServletRequest request) throws Exception {

        this.asr = asrForm;

        // Check if the reconstruction is in the sample list
        if (Defines.EXAMPLE_RECONSTRUCTIONS.contains(asr.getData())) {
            // We just want to load an already existing reconstruction
            ModelAndView mav = loadReconByLabel(asr.getData());
            if (mav == null) {
                mav = new ModelAndView("index");
                mav.addObject("error", true);
                mav.addObject("errorMessage", "Issue loading default reconstruction. Please try again.");
                mav.addObject("user", loggedInUser);
                mav.addObject("username", loggedInUser.getUsername());
                mav.addObject("email", loggedInUser.getEmail());

                return mav;
            }
            return mav;
        }

        // ToDo: Also check here that they have a unique label
        String err = null;
        if (asr.getLabel().equals("")) {
            err = "recon.require.label";
        } else {
            err = reconController.isLabelUnique(asr.getLabel());
        }

        if (err != null) {
            ModelAndView mav = new ModelAndView("index");
            mav.addObject("error", true);
            mav.addObject("errorMessage", err);
            mav.addObject("user", loggedInUser);
            mav.addObject("username", loggedInUser.getUsername());
            mav.addObject("email", loggedInUser.getEmail());

            return mav;
        }

        logger.log(Level.INFO,
                "NEW, request_addr: " + request.getRemoteAddr() + ", infer_type: " + asr
                        .getInferenceType());// + ", mem_bytes: " + ObjectSizeCalculator.getObjectSize(asr));

        Exception exception = asr.runForSession();

        if (exception != null) {
            ModelAndView mav = new ModelAndView("index");
            mav.addObject("error", true);
            String message = exception.getMessage();
            logger.log(Level.SEVERE, "ERR, request_addr: " + request
                    .getRemoteAddr() + " error: " + message);
            if (exception.getMessage() == null || exception.getMessage()
                    .contains("FileNotFoundException")) {
                message = checkErrors(asr);
            }
            mav.addObject("errorMessage", message);
            mav.addObject("user", loggedInUser);
            mav.addObject("username", loggedInUser.getUsername());
            mav.addObject("email", loggedInUser.getEmail());


            return mav;
        }

        /**
         * Here if they are aiming to save it we just save and send an email
         */

         if (asr.getSave()) {
            // check if a user is logged in
            if (loggedInUser.getId() == Defines.FALSE) {
                ModelAndView mav = new ModelAndView("index");
                mav.addObject("errorMessage", "You need to be logged in to be able to save a reconstruction, sorry!");
                mav.addObject("user", loggedInUser);
                mav.addObject("error", true);
                return mav;
            }
            if (saveController != null) {
                isSaving = saveController.getIsSaving();
                if (isSaving) {
                    ModelAndView mav = new ModelAndView("index");
                    mav.addObject("errorMessage",
                            "You can only save one reconstruction at a time, sorry! We're working on batching this :) ");
                    mav.addObject("user", loggedInUser);
                    mav.addObject("error", true);
                    return mav;
                }
            }
            // Set the loggedin users email temp
//            loggedInUser.setEmail(asr.getEmail());
            saveCurrReconStartThread();
            ModelAndView mav = accountView.get(loggedInUser, userController);
            mav.addObject("type", "saving");
            return mav;
        } else {
            recon = new ASRThread(asr, asr.getInferenceType(), asr.getNodeLabel(), false, logger,
                    loggedInUser, reconController);
        }
        ModelAndView mav = new ModelAndView("processing");
        mav.addObject("user", loggedInUser);
        mav.addObject("username", loggedInUser.getUsername());
        mav.addObject("email", loggedInUser.getEmail());


        return mav;
    }

    /**
     * Used to load the save attributes of a reconstruction.
     */
    public void loadReconToASR() {
        if (currRecon == null || currRecon.getId() != Defines.UNINIT) {
            currRecon = reconController.getByIdForMarginal(currRecon.getId(),
                    loggedInUser);
            asr = new ASRObject();
            asr.setLabel(currRecon.getLabel());
            asr.setInferenceType(currRecon.getInferenceType());
            asr.setModel(currRecon.getModel());
            asr.setNodeLabel(currRecon.getNode());
            asr.setTree(currRecon.getTree());
            asr.setReconstructedTree(currRecon.getReconTree());
            asr.setMSA(currRecon.getMsa());
            asr.setAncestor(currRecon.getAncestor());
            asr.loadSequences(currRecon.getSequences());
            asr.setJointInferences(currRecon.getJointInferences());
            asr.loadParameters();
            // Also set the ancestor and MSA
            ancestor = new JSONObject(currRecon.getAncestor());
            msa = new JSONObject(currRecon.getMsa());
        }
        if (runningMarginal) {
            marginalAsr = new ASRObject();
            marginalAsr.setLabel(asr.getLabel());
            marginalAsr.setInferenceType(asr.getInferenceType());
            marginalAsr.setModel(asr.getModel());
            marginalAsr.setTree(asr.getTree());
            marginalAsr.setReconstructedTree(asr.getReconstructedNewickString());
            marginalAsr.setMSA(asr.getMSA());
            marginalAsr.setAncestor(asr.getAncestor());
            marginalAsr.loadSequences(asr.getSequences());
            marginalAsr.setJointInferences(asr.getJointInferences());
            marginalAsr.loadParameters();
        }
    }


    /**
     * ---------------------------------------------------------------------------------------------
     *
     *                                  Downloads section.
     *
     * ---------------------------------------------------------------------------------------------
     */

    /**
     * Download files from reconstruction
     *
     * @param request HTTP request (form request specifying parameters)
     * @param response HTTP response to send data to client
     */
    @RequestMapping(value = "/download-tutorial-files", method = RequestMethod.GET, produces = "application/zip")
    public void downloadTutorial(HttpServletRequest request, HttpServletResponse response) {

        // Don't copy to an actual folder on the server just serve the files immidiately
        response.setStatus(HttpServletResponse.SC_OK);
        response.setHeader("Content-Disposition", "attachment; filename=\"GRASP_Tutorial.zip\"");

        try {
            // get your file as InputStream
            InputStream is = Thread.currentThread().getContextClassLoader().getResourceAsStream(
                    "data/app/tutorial/tutorial.zip");
            // copy it to response's OutputStream
            FileCopyUtils.copy(is, response.getOutputStream());
            response.flushBuffer();
        } catch (IOException ex) {
            System.out.println("Error writing file to output stream. Filename was" + ex.toString());
            throw new RuntimeException("IOError writing file to output stream");
        }

    }
    /**
     * Download files from reconstruction
     *
     * @param request HTTP request (form request specifying parameters)
     * @param response HTTP response to send data to client
     */
    @RequestMapping(value = "/download-workshop_tps-files", method = RequestMethod.GET, produces = "application/zip")
    public void downloadWorkshop_TPS(HttpServletRequest request, HttpServletResponse response) {

        // Don't copy to an actual folder on the server just serve the files immidiately
        response.setStatus(HttpServletResponse.SC_OK);
        response.setHeader("Content-Disposition", "attachment; filename=\"GRASP_Workshop_TPS.zip\"");

        try {
            // get your file as InputStream
            InputStream is = Thread.currentThread().getContextClassLoader().getResourceAsStream(
                    "data/app/tutorial/tpswb_v5.zip");
            // copy it to response's OutputStream
            FileCopyUtils.copy(is, response.getOutputStream());
            response.flushBuffer();
        } catch (IOException ex) {
            System.out.println("Error writing file to output stream. Filename was" + ex.toString());
            throw new RuntimeException("IOError writing file to output stream");
        }

    }


    /**
     * Download either the marginal or the joint reconstruction.
     *
     * @param type
     * @return
     */
    @RequestMapping(value = "/download-ancs" , method = RequestMethod.POST)
    public @ResponseBody String downloadJoint(@RequestBody String type) {
        String err = verify();

        JSONObject data = new JSONObject();
        ArrayList<String> ancs;

        // Check if we have an error.
        if (err != null) {
            data.put("error", err);
            return data.toString();
        }

        int ancsType = Defines.JOINT;

        if (type != null && !type.equals("joint")) {
            if (type.equals("marginal")) {
                ancsType = Defines.MARGINAL;

                ancs = seqController.getAllSeqLabels(currRecon.getId(),ancsType);

            } else {
                // Now we know we have  a list of ancestors to download
                ancs =  new ArrayList<String>(Arrays.asList(type.split(",")));
                // If we have no elements in the array return that
                if (ancs.size() < 1) {
                    data.put("error", "You need to input at least one node ID.");
                    return data.toString();
                }
            }
        } else {
            ancs = seqController.getAllSeqLabels(currRecon.getId(),ancsType);
        }

        Collections.sort(ancs, new NaturalOrderComparator());

        String fastaFileString = "";
        for (String nodeLabel: ancs) {
            fastaFileString += ">" + nodeLabel + "\n";
            fastaFileString += seqController.getSeqByLabel(nodeLabel, currRecon.getId(), ancsType) + "\n";
        }

        // Add the type in and the other metrics
        data.put("filecontent", fastaFileString);
        data.put("filetype", "txt");
        data.put("filename", currRecon.getLabel() + "_" + type + "-ancestors_GRASP.fasta");

        // Return the string
        return data.toString();
    }

    /**
     * Download the annotated phylogenetic tree
     * @return
     */
    @RequestMapping(value = "/download-tree" , method = RequestMethod.GET)
    public @ResponseBody String downloadTree() {
        String err = verify();
        JSONObject data = new JSONObject();

        // Check if we have an error.
        if (err != null) {
            data.put("error", err);
            return data.toString();
        }

        // Add the type in and the other metrics
        data.put("filecontent", treeController.getReconTreeById(currRecon.getId(), loggedInUser.getId()));
        data.put("filetype", "txt");
        data.put("filename", currRecon.getLabel() + "_reconstructed-tree_GRASP.nwk");

        // Return the string
        return data.toString();
    }


    private String checkErrors(ASRObject asr) {

        String message = null;
        if (!asr.getLoaded()) {
            if ((asr.getData() == null || asr.getData().equalsIgnoreCase("") || asr.getData()
                    .equalsIgnoreCase("none"))
                    && (asr.getSeqFile() == null || asr.getSeqFile().getOriginalFilename()
                    .equalsIgnoreCase("")) &&
                    (asr.getAlnFile() == null || asr.getAlnFile().getOriginalFilename()
                            .equalsIgnoreCase(""))) {
                message = "No sequence or alignment file specified.";
            } else if ((asr.getSeqFile() != null && !asr.getSeqFile().getOriginalFilename()
                    .endsWith(".aln") &&
                    !asr.getSeqFile().getOriginalFilename().endsWith(".fa") && !asr.getSeqFile()
                    .getOriginalFilename().endsWith(".fasta")) ||
                    (asr.getAlnFile() != null && !asr.getAlnFile().getOriginalFilename()
                            .endsWith(".aln") &&
                            !asr.getAlnFile().getOriginalFilename().endsWith(".fa") && !asr
                            .getAlnFile().getOriginalFilename().endsWith(".fasta"))) {
                message = "Incorrect sequence or alignment format (requires FASTA or Clustal format .aln, .fa or .fasta).";
            } else if (((asr.getSeqFile() != null && !asr.getSeqFile().getOriginalFilename()
                    .equalsIgnoreCase("")) ||
                    (asr.getAlnFile() != null && !asr.getAlnFile().getOriginalFilename()
                            .equalsIgnoreCase(""))) &&
                    (asr.getTreeFile() == null || asr.getTreeFile().getOriginalFilename()
                            .equalsIgnoreCase(""))) {
                message = "No phylogenetic tree file specified.";
            } else if (asr.getTreeFile() != null && !asr.getTreeFile().getOriginalFilename()
                    .endsWith(".nwk")) {
                message = "Incorrect phylogenetic tree format (requires Newick format .nwk).";
            }
        }
        return message;
    }

}
