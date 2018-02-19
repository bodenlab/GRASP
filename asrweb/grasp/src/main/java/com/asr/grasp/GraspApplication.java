package com.asr.grasp;

import org.apache.tomcat.util.http.fileupload.IOUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.web.support.SpringBootServletInitializer;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.context.annotation.SessionScope;
import org.springframework.web.servlet.ModelAndView;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.validation.Valid;
import java.io.*;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;


@Controller
@SpringBootApplication
@SessionScope
public class GraspApplication extends SpringBootServletInitializer {

	//final static String sessionPath = "/Users/marnie/Documents/WebSessions/";
		final String sessionPath = "/Users/gabefoley/Documents/WebSessions/";
//	private final static String sessionPath = "/var/www/GRASP/";

	private String status = "";

	private final static Logger logger = Logger.getLogger(GraspApplication.class.getName());


	@Override
	protected SpringApplicationBuilder configure(SpringApplicationBuilder application) {
		return application.sources(GraspApplication.class);
	}

	public static void main(String[] args) {
		SpringApplication.run(GraspApplication.class, args);
	}


	@Autowired
	private ASR asr;

	/**
	 * Initialise the initial form in the index
	 *
	 * @return index html
	 */
	@RequestMapping(value = "/", method = RequestMethod.GET)
	public String showForm(Model model) {
		this.asr = new ASR();
		model.addAttribute("asrForm", this.asr);
		return "index";
	}

	/**
	 * Show guide
	 *
	 * @return guide html
	 */
	@RequestMapping(value = "/guide", method = RequestMethod.GET)
	public String showGuide(Model model) {
		model.addAttribute("results", asr.getLabel() != "");
		return "guide";
	}

	/**
	 * Show error
	 *
	 * @return index html
	 */
	@RequestMapping(value = "/error", method = RequestMethod.GET)
	public String showError(Model model) {
		model.addAttribute("asrForm", asr);
		model.addAttribute("error", true);
		model.addAttribute("errorMessage", "Sorry! An unknown error occurred. Please check the error types in the guide and retry your reconstruction... ");
		return "index";
	}

	/**
	 * Show status of reconstruction while asynchronously performing analysis
	 *
	 * @return status of reconstruction
	 */
	@RequestMapping(value = "/", method = RequestMethod.GET, params = {"request"})
	public @ResponseBody String showStatus(@RequestParam("request") String request, Model model) throws IOException {

		if (status.equalsIgnoreCase("done") || status.contains("error")) {
			String stat = status;
			asr.setFirstPass(true); // reset flag
			asr.setPrevProgress(0);
			status = "";
			return stat;
		}

		// try to get current node ID
		int progress = (100*asr.getReconCurrentNodeId())/asr.getNumberAlnCols();
		if (asr.getFirstPass() && progress < asr.getPrevProgress())
			asr.setFirstPass(false);

		progress = asr.getFirstPass() ? progress/2 : 50 + progress/2;
		if (progress > asr.getPrevProgress())
			asr.setPrevProgress(progress);

		return asr.getPrevProgress() + "%";
	}

	@RequestMapping(value = "/", method = RequestMethod.GET, params={"getrecon"})
	public ModelAndView returnASR(Model model) {

		model.addAttribute("label", asr.getLabel());

		// add reconstructed newick string to send to javascript
		model.addAttribute("tree", asr.getReconstructedNewickString());

		// add msa and inferred ancestral graph
		String graphs = asr.catGraphJSONBuilder(asr.getMSAGraphJSON(), asr.getAncestralGraphJSON(asr.getInferenceType(), asr.getNodeLabel()));
		model.addAttribute("graph", graphs);

		// add attribute to specify to view results (i.e. to show the graph, tree, etc)
		model.addAttribute("inferenceType", asr.getInferenceType());
		model.addAttribute("results", true);

		return new ModelAndView("index");
	}

	@RequestMapping(value = "/", method = RequestMethod.POST, params={"getrecongraph"})
	public @ResponseBody String returnASRGraph(@RequestParam("getrecongraph") String getrecongraph, Model model, HttpServletRequest request) {

		model.addAttribute("label", asr.getLabel());

		// add reconstructed newick string to send to javascript
		model.addAttribute("tree", asr.getReconstructedNewickString());

		// add msa and inferred ancestral graph
		String graphs = asr.catGraphJSONBuilder(asr.getMSAGraphJSON(), asr.getAncestralGraphJSON(asr.getInferenceType(), asr.getNodeLabel()));
		model.addAttribute("graph", graphs);

		// add attribute to specify to view results (i.e. to show the graph, tree, etc)
		model.addAttribute("inferenceType", asr.getInferenceType());
		model.addAttribute("results", true);

		return graphs;
	}


	/**
	 * Submit the asr form (documenting input details, i.e. aln and tree file, etc)
	 *
	 * @param asrForm       ASR object
	 * @param bindingResult Form result, indicating any input errors
	 * @param model         com model
	 * @return index with results as attributes in the model
	 */
	@RequestMapping(value = "/", method = RequestMethod.POST, params = "submitAsr")
	public String performReconstruction(@Valid @ModelAttribute("asrForm") ASR asrForm, BindingResult bindingResult, Model model, HttpServletRequest request) throws Exception {

		this.asr = asrForm;

		logger.log(Level.INFO, "NEW, request_addr: " + request.getRemoteAddr() + ", infer_type: " + asr.getInferenceType());// + ", mem_bytes: " + ObjectSizeCalculator.getObjectSize(asr));

		// upload supplied files
		try {
			File sessionDir = new File(sessionPath + asr.getSessionId());
			if (!sessionDir.exists())
				sessionDir.mkdir();

			asr.setSessionDir(sessionDir.getAbsolutePath() + "/");

			if (asr.getSeqFile() != null || asr.getAlnFile() != null) {
				// aligning input data before performing reconstruction
				if (asr.getSeqFile() != null) {
					asr.getSeqFile().transferTo(new File(asr.getSessionDir() + asr.getSeqFile().getOriginalFilename()));
					asr.setAlnFilepath(asr.getSessionDir() + asr.getSeqFile().getOriginalFilename());
					asr.setPerformAlignment(true);
				}
				// performing reconstruction on already aligned data
				if (asr.getAlnFile() != null) {
					asr.getAlnFile().transferTo(new File(asr.getSessionDir() + asr.getAlnFile().getOriginalFilename()));
					asr.setAlnFilepath(asr.getSessionDir() + asr.getAlnFile().getOriginalFilename());
				}
				asr.getTreeFile().transferTo(new File(asr.getSessionDir() + asr.getTreeFile().getOriginalFilename()));
				asr.setTreeFilepath(asr.getSessionDir() + asr.getTreeFile().getOriginalFilename());
			} else {
				// performing reconstruction on test data
				File alnFile = new File(Thread.currentThread().getContextClassLoader().getResource(asr.getData() + ".aln").toURI());
				asr.setAlnFilepath(asr.getSessionDir() + asr.getData() + ".aln");
				Files.copy(alnFile.toPath(), (new File(asr.getAlnFilepath())).toPath(), StandardCopyOption.REPLACE_EXISTING);
				File treeFile = new File(Thread.currentThread().getContextClassLoader().getResource(asr.getData() + ".nwk").toURI());
				asr.setTreeFilepath(asr.getSessionDir() + asr.getData() + ".nwk");
				Files.copy(treeFile.toPath(), (new File(asr.getTreeFilepath())).toPath(), StandardCopyOption.REPLACE_EXISTING);
			}

			if (asr.getLabel() == "")
				asr.setLabel("Grasp");

		} catch (Exception e) {
			model.addAttribute("error", true);
			String message = e.getMessage();
			logger.log(Level.SEVERE, "ERR, request_addr: " + request.getRemoteAddr() + " error: " + message);
			if (e.getMessage() == null || e.getMessage().contains("FileNotFoundException"))
				message = checkErrors(asr);
			model.addAttribute("errorMessage", message);
			System.err.println("Error: " + message);
			return "index";
		}

		// run reconstruction
		new Thread(() -> {
			status = asyncRunReconstruction(model, request);
		}, "ASR-" + System.nanoTime()).start();

		return "processing";
	}

	/**
	 * Asynchronously run the reconstruction analysis so that the browser won't time out on large jobs. The site will
	 * poll the status every 1s.
	 *
	 * @param model
	 * @param request
	 * @return "done" indication
	 */
	public String asyncRunReconstruction(Model model, HttpServletRequest request){

		long start = System.currentTimeMillis();

		// run reconstruction
		try {
			asr.runReconstruction();

			long delta = System.currentTimeMillis() - start;
			logger.log(Level.INFO, "SESS, request_addr: " + request.getRemoteAddr() + ", infer_type: " + asr.getInferenceType() + ", num_seqs: " + asr.getNumberSequences() +
					", num_bases: " + asr.getNumberBases() + ", num_ancestors: " + asr.getNumberAncestors() + ", num_deleted: " + asr.getNumberDeletedNodes() +
					", time_ms: " + delta + ", num_threads: " + asr.getNumberThreads());// + ", mem_bytes: " + ObjectSizeCalculator.getObjectSize(asr));
		} catch (Exception e) {
			model.addAttribute("error", true);
			String message = e.getMessage();
			logger.log(Level.SEVERE, "ERR, request_addr: " + request.getRemoteAddr() + " error: " + message);
			if (e.getMessage() == null || e.getMessage().contains("FileNotFoundException"))
				message = checkErrors(asr);
			model.addAttribute("errorMessage", message);
			System.err.println("Error: " + message);
			return "error\t"+message;
		}

		return "done";
	}

	/**
	 * Perform marginal reconstruction of specified tree node.
	 *
	 * @param infer inference type (Expects marginal)
	 * @param node  node label
	 * @param model com model
	 * @return graphs in JSON format
	 */
	@RequestMapping(value = "/", method = RequestMethod.POST, params = {"infer", "node"})
	public ModelAndView performReconstruction(@RequestParam("infer") String infer, @RequestParam("node") String node, Model model, HttpServletRequest request) {

		asr.setInferenceType(infer);
		asr.setNodeLabel(node);

		// run reconstruction
		new Thread(() -> {
			status = asyncRunReconstruction(model, request);
		}, "ASR-" + System.nanoTime()).start();

		return new ModelAndView("processing");
	}

	/**
	 * Download files from reconstruction
	 *
	 * @param request   HTTP request (form request specifying parameters)
	 * @param response  HTTP response to send data to client
	 * @throws IOException
	 */
	@RequestMapping(value = "/", method = RequestMethod.GET, params = "download", produces = "application/zip")
	public void showForm(HttpServletRequest request, HttpServletResponse response) throws IOException {

		response.setStatus(HttpServletResponse.SC_OK);
		response.setHeader("Content-Disposition", "attachment; filename=\"GRASP_" + asr.getLabel() + ".zip\"");

		// create temporary folder to send output as zipped files
		String tempDir = asr.getSessionDir() + "/GRASP_" + asr.getLabel();
		File sessionDir = new File(tempDir);
		if (sessionDir.exists()) {
			for (File file : sessionDir.listFiles())
				file.delete();
			sessionDir.delete();
		}
		sessionDir.mkdir();

		// copy output files to temporary folder, or generate output where needed and save in temporary folder
		if (request.getParameter("check-recon-tree") != null && request.getParameter("check-recon-tree").equalsIgnoreCase("on"))
			Files.copy((new File(asr.getSessionDir() + asr.getReconstructedTreeFileName())).toPath(),
					(new File(tempDir + "/" + asr.getReconstructedTreeFileName())).toPath(), StandardCopyOption.REPLACE_EXISTING);
		if (request.getParameter("check-pog-msa") != null && request.getParameter("check-pog-msa").equalsIgnoreCase("on"))
			asr.saveMSA(tempDir + "/");
		if (request.getParameter("check-pog-marg") != null && request.getParameter("check-pog-marg").equalsIgnoreCase("on"))
			asr.saveAncestorGraph(request.getParameter("node-label"), tempDir + "/", false);
		if (request.getParameter("check-marg-dist") != null && request.getParameter("check-marg-dist").equalsIgnoreCase("on"))
			asr.saveMarginalDistribution(tempDir, request.getParameter("marg-node"));
		if (request.getParameter("check-pog-joint") != null && request.getParameter("check-pog-joint").equalsIgnoreCase("on"))
			asr.saveAncestors(tempDir + "/");
		if (request.getParameter("check-pog-joint-single") != null && request.getParameter("check-pog-joint-single").equalsIgnoreCase("on"))
			asr.saveAncestorGraph(request.getParameter("joint-node"), tempDir + "/", true);
		if (request.getParameter("check-seq-marg") != null && request.getParameter("check-seq-marg").equalsIgnoreCase("on"))
			asr.saveConsensusMarginal(tempDir + "/" + request.getParameter("marg-node") + "_consensus");
		if (request.getParameter("check-seq-joint-single") != null && request.getParameter("check-seq-joint-single").equalsIgnoreCase("on"))
			asr.saveConsensusJoint(tempDir + "/" + request.getParameter("joint-node") + "_consensus", request.getParameter("joint-node"));
		if (request.getParameter("check-msa-marg-dist") != null && request.getParameter("check-msa-marg-dist").equalsIgnoreCase("on"))
			asr.saveMarginalDistribution(tempDir + "/", "msa");
		if (request.getParameter("check-seq-joint") != null && request.getParameter("check-seq-joint").equalsIgnoreCase("on"))
			asr.saveConsensusJoint(tempDir + "/ancestors_consensus", null);
		if (request.getParameter("check-msa-aln") != null && request.getParameter("check-msa-aln").equalsIgnoreCase("on"))
			asr.saveMSAAln(tempDir + "/" + asr.getLabel());

		// send output folder to client
		ZipOutputStream zout = new ZipOutputStream(response.getOutputStream());
		zipFiles(sessionDir, zout);
		zout.close();

	}

	/**
	 * Helper functions to zip files/directories
	 **/
	private void zipFiles(File folder, ZipOutputStream zout) throws IOException {
		for (File file : folder.listFiles()) {
			if (file.isFile()) {
				zout.putNextEntry(new ZipEntry(file.getName()));
				FileInputStream fis = new FileInputStream(file);
				IOUtils.copy(fis, zout);
				fis.close();
				zout.closeEntry();
			}
		}
	}

	private String checkErrors(ASR asr) {
		String message = null;
		if ((asr.getData() == null || asr.getData().equalsIgnoreCase("") || asr.getData().equalsIgnoreCase("none"))
				&& (asr.getSeqFile() == null || asr.getSeqFile().getOriginalFilename().equalsIgnoreCase("")) &&
				(asr.getAlnFile() == null || asr.getAlnFile().getOriginalFilename().equalsIgnoreCase("")))
			message = "No sequence or alignment file specified.";
		else if ((asr.getSeqFile() != null && !asr.getSeqFile().getOriginalFilename().endsWith(".aln") &&
				!asr.getSeqFile().getOriginalFilename().endsWith(".fa") && !asr.getSeqFile().getOriginalFilename().endsWith(".fasta")) ||
				(asr.getAlnFile() != null && !asr.getAlnFile().getOriginalFilename().endsWith(".aln") &&
						!asr.getAlnFile().getOriginalFilename().endsWith(".fa") && !asr.getAlnFile().getOriginalFilename().endsWith(".fasta")))
			message = "Incorrect sequence or alignment format (requires FASTA or Clustal format .aln, .fa or .fasta).";
		else if (((asr.getSeqFile() != null && !asr.getSeqFile().getOriginalFilename().equalsIgnoreCase("")) ||
				(asr.getAlnFile() != null && !asr.getAlnFile().getOriginalFilename().equalsIgnoreCase(""))) &&
				(asr.getTreeFile() == null || asr.getTreeFile().getOriginalFilename().equalsIgnoreCase("")))
			message = "No phylogenetic tree file specified.";
		else if (asr.getTreeFile() != null && !asr.getTreeFile().getOriginalFilename().endsWith(".nwk"))
			message = "Incorrect phylogenetic tree format (requires Newick format .nwk).";
		return message;
	}

}
