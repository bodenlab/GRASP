package com.asr.grasp;

import org.apache.tomcat.util.http.fileupload.IOUtils;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.web.support.SpringBootServletInitializer;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.validation.Valid;
import java.io.*;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@Controller
@SpringBootApplication
public class GraspApplication extends SpringBootServletInitializer {

	@Override
	protected SpringApplicationBuilder configure(SpringApplicationBuilder application) {
		return application.sources(GraspApplication.class);
	}

	public static void main(String[] args) {
		SpringApplication.run(GraspApplication.class, args);
	}

	final String sessionId = "grasp" + Long.toString(System.currentTimeMillis());

	//final String sessionPath = "/home/ariane/Documents/bodenlab/data/WebSessions";
	final String sessionPath = "/Users/marnie/Documents/WebSessions/";
	//final String sessionPath = "/var/www/GRASP/";

	private ASR asr;


	/**
	 * Initialise the initial form in the index
	 *
	 * @return index html
	 */
	@RequestMapping(value = "/", method = RequestMethod.GET)
	public String showForm(Model model) {
		System.out.println("showForm");
		model.addAttribute("asrForm", new ASR());
		return "index";
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
	public String performReconstruction(@Valid @ModelAttribute("asrForm") ASR asrForm, BindingResult bindingResult, Model model) {
		this.asr = asrForm;

		model.addAttribute("label", asr.getLabel());

		if (bindingResult.hasErrors()) {
			for (String err : bindingResult.getSuppressedFields())
				System.out.println(err);
			return "index";
		}

		// upload supplied files
		try {
			File sessionDir = new File(sessionPath + sessionId);
			if (!sessionDir.exists())
				sessionDir.mkdir();

			asr.setSessionDir(sessionDir.getAbsolutePath() + "/");

			asr.getAlnFile().transferTo(new File(asr.getSessionDir() + asr.getAlnFile().getOriginalFilename()));
			asr.setAlnFilepath(asr.getSessionDir() + asr.getAlnFile().getOriginalFilename());
			asr.getTreeFile().transferTo(new File(asr.getSessionDir() + asr.getTreeFile().getOriginalFilename()));
			asr.setTreeFilepath(asr.getSessionDir() + asr.getTreeFile().getOriginalFilename());

			// TODO: push exceptions to error message on view...
			asr.runReconstruction();

			// add reconstructed newick string to send to javascript
			model.addAttribute("tree", asr.getReconstructedNewickString());

			// add msa and inferred ancestral graph
			String graphs = asr.catGraphJSONBuilder(asr.getMSAGraphJSON(), asr.getAncestralGraphJSON(asr.getInferenceType(),"root"));

			model.addAttribute("graph", graphs);

		} catch (Exception e) {
			model.addAttribute("error", true);
			model.addAttribute("errorMessage", e.getMessage());
			System.out.println("Error: " + e.getMessage());
			return "index";
		}

		// add attribute to specify to view results (i.e. to show the graph, tree, etc)
		model.addAttribute("inferenceType", asr.getInferenceType());
		model.addAttribute("results", true);

		return "index";
	}

	/**
	 * Submit the asr form (documenting input details, i.e. aln and tree file, etc)
	 *
	 * @param asrForm ASR object
	 * @param model   com model
	 * @return index with results as attributes in the model
	 */
	@RequestMapping(value = "/", method = RequestMethod.POST, params = "test")
	public String performReconstruction(@ModelAttribute("asrForm") ASR asrForm, Model model) {

		this.asr = asrForm;

		// upload supplied files
		try {
			File sessionDir = new File(sessionPath + sessionId);
			if (!sessionDir.exists())
				sessionDir.mkdir();

			asr.setSessionDir(sessionDir.getAbsolutePath() + "/");
			asr.setLabel("Test");
			asr.setInferenceType("joint");

			// copy default data to user session folder

			File alnFile = new File(Thread.currentThread().getContextClassLoader().getResource("default.aln").toURI());
			asr.setAlnFilepath(asr.getSessionDir() + "default.aln");
			Files.copy(alnFile.toPath(), (new File(asr.getAlnFilepath())).toPath(), StandardCopyOption.REPLACE_EXISTING);
			File treeFile = new File(Thread.currentThread().getContextClassLoader().getResource("default.nwk").toURI());
			asr.setTreeFilepath(asr.getSessionDir() + "default.nwk");
			Files.copy(treeFile.toPath(), (new File(asr.getTreeFilepath())).toPath(), StandardCopyOption.REPLACE_EXISTING);

			// TODO: push exceptions to error message on view...
			asr.runReconstruction();

			// add reconstructed newick string to send to javascript
			model.addAttribute("tree", asr.getReconstructedNewickString());

			// add msa and inferred ancestral graph
			String graphs = asr.catGraphJSONBuilder(asr.getMSAGraphJSON(), asr.getAncestralGraphJSON(asr.getInferenceType(), "root"));

			model.addAttribute("graph", graphs);
			model.addAttribute("label", asr.getLabel());

		} catch (Exception e) {
			model.addAttribute("error", true);
			model.addAttribute("errorMessage", e.getMessage());
			System.out.println("Error: " + e.getMessage());
			return "index";
		}

		// add attribute to specify to view results (i.e. to show the graph, tree, etc)
		model.addAttribute("inferenceType", asr.getInferenceType());
		model.addAttribute("results", true);

		return "index";
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
	public @ResponseBody String performReconstruction(@RequestParam("infer") String infer, @RequestParam("node") String node, Model model) {

		System.out.println("infer,node: " + infer + " " + node);
		model.addAttribute("results", true);
		model.addAttribute("label", asr.getLabel());

		// TODO: push exceptions to error message on view...
		try {
			asr.setInferenceType(infer);

			if (infer.equalsIgnoreCase("marginal")) {
				asr.setMarginalNodeLabel(node);
				asr.runReconstruction();
			}

			// add reconstructed newick string to send to javascript
			model.addAttribute("tree", asr.getReconstructedNewickString());

		} catch (Exception e) {
			model.addAttribute("error", true);
			model.addAttribute("errorMessage", e.getMessage());
			System.out.println("Error: " + e.getMessage());
			return "index";
		}
		// add msa and inferred ancestral graph
		String graphs = asr.catGraphJSONBuilder(asr.getMSAGraphJSON(), asr.getAncestralGraphJSON(infer, node));

		model.addAttribute("graph", graphs);
		model.addAttribute("inferenceType", asr.getInferenceType());

		// add attribute to specify to view results (i.e. to show the graph, tree, etc)
		return graphs;

	}

	/**
	 * Download files from reconstruction
	 *
	 * @param request   HTTP request (form request specifying parameters)
	 * @param response  HTTP response to send data to client
	 * @throws IOException
	 */
	@RequestMapping(value = "/", method = RequestMethod.GET, params = "download")
	public void showForm(HttpServletRequest request, HttpServletResponse response) throws IOException {

		response.setHeader("Content-Type", "application/zip");
		response.setHeader("Content-Disposition", "attachment; filename=GRASP_" + asr.getLabel() + ".zip");

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
		String jointPath = tempDir + "/Joint_reconstruction";
		String marginalPath = tempDir + "/Marginal_reconstruction";
		if (request.getParameter("check-recon-tree") != null && request.getParameter("check-recon-tree").equalsIgnoreCase("on"))
			Files.copy((new File(asr.getSessionDir() + asr.getReconstructedTreeFileName())).toPath(),
					(new File(tempDir + "/" + asr.getReconstructedTreeFileName())).toPath(), StandardCopyOption.REPLACE_EXISTING);
		if (request.getParameter("check-pog-msa") != null && request.getParameter("check-pog-msa").equalsIgnoreCase("on"))
			asr.saveMSA(tempDir + "/");
		if (request.getParameter("check-pog-marg") != null && request.getParameter("check-pog-marg").equalsIgnoreCase("on")) {
			File marginalDir = new File(marginalPath);
			if (!marginalDir.exists())
				marginalDir.mkdir();
			asr.saveAncestorGraph(request.getParameter("marg-node"), marginalPath + "/");
		}
		if (request.getParameter("check-marg-dist") != null && request.getParameter("check-marg-dist").equalsIgnoreCase("on")) {
			File marginalDir = new File(marginalPath);
			if (!marginalDir.exists())
				marginalDir.mkdir();
			asr.saveMarginalDistribution(marginalPath, request.getParameter("marg-node"));
		}
		if (request.getParameter("check-pog-joint") != null && request.getParameter("check-pog-joint").equalsIgnoreCase("on")) {
			File jointDir = new File(jointPath);
			if (!jointDir.exists())
				jointDir.mkdir();
			asr.saveAncestors(jointPath + "/");
		}
		if (request.getParameter("check-seq-marg") != null && request.getParameter("check-seq-marg").equalsIgnoreCase("on")) {
			File marginalDir = new File(marginalPath);
			if (!marginalDir.exists())
				marginalDir.mkdir();
			asr.saveConsensusMarginal(marginalPath + "/" + request.getParameter("marg-node") + "_consensus");
		}
		if (request.getParameter("check-msa-marg-dist") != null && request.getParameter("check-msa-marg-dist").equalsIgnoreCase("on")) {
			File marginalDir = new File(marginalPath);
			if (!marginalDir.exists())
				marginalDir.mkdir();
			asr.saveMarginalDistribution(marginalPath, "msa");
		}
		if (request.getParameter("check-seq-joint") != null && request.getParameter("check-seq-joint").equalsIgnoreCase("on")) {
			File jointDir = new File(jointPath);
			if (!jointDir.exists())
				jointDir.mkdir();
			asr.saveConsensusJoint(jointPath + "/ancestors_consensus");
		}

		//asr.saveMSAImage(tempDir + "/MSA.png");

		// send output folder to client
		zipFolder(sessionDir, response.getOutputStream());

	}

	/**
	 * Helper functions to zip files/directories
	 **/

	private  void zipFolder(final File folder, final File zipFile) throws IOException {
		zipFolder(folder, new FileOutputStream(zipFile));
	}

	private  void zipFolder(final File folder, final OutputStream outputStream) throws IOException {
		ZipOutputStream zipOutputStream = new ZipOutputStream(outputStream);
		processFolder(folder, zipOutputStream, folder.getPath().length() + 1);
	}

	private  void processFolder(final File folder, final ZipOutputStream zos, final int prefixLength)
			throws IOException {
		for (final File file : folder.listFiles()) {
			if (file.isFile()) {
				final ZipEntry zipEntry = new ZipEntry(file.getPath().substring(prefixLength));
				zos.putNextEntry(zipEntry);
				FileInputStream fis = new FileInputStream(file);
				IOUtils.copy(fis, zos);
				zos.closeEntry();
				fis.close();
			} else if (file.isDirectory()) {
				processFolder(file, zos, prefixLength);
			}
		}
	}
}
