const { Projects } = require("../../../db/projects");

const { responseProject } = require("../../../schema/schema");
const { responseProjectUsers } = require("../../../schema/schema");
const { responseTask } = require("../../../schema/schema");

const successfulResponse = {
	200: {
		type: "object",
		properties: {
			data: {
				type: "object",
				properties: responseProject,
				required: ["id", "name", "wid"]
			}
		}
	}
};

module.exports = async fastify => {
	const projectIdParam = {
		type: "object",
		properties: {
			project_id: {
				type: "string",
				description: "project id"
			}
		}
	};

	const projectByIdSchema = {
		schema: {
			tags: ["projects"],
			summary: "Get project data",
			params: projectIdParam,
			response: successfulResponse
		}
	};
	fastify.get("/:project_id", projectByIdSchema, async request => {
		const project = await Projects.getById(request.params.project_id);
		return { data: project };
	});

	const { id, at, ...projectPost } = responseProject;
	const projectPostSchema = {
		schema: {
			tags: ["projects"],
			summary: "Create project",
			body: {
				type: "object",
				properties: {
					project: {
						type: "object",
						properties: projectPost,
						required: ["name", "wid"]
					}
				}
			},
			response: successfulResponse
		}
	};
	fastify.post("/", projectPostSchema, async (request, reply) => {
		try {
			const project = await Projects.create(request.body.project);
			return { data: project };
		} catch (e) {
			if (e.code === "23505") {
				reply.code(400).send("Name has already been taken");
			}
		}
	});

	const updateProjectSchema = {
		schema: {
			tags: ["projects"],
			params: projectIdParam,
			body: {
				type: "object",
				properties: {
					project: {
						type: "object",
						properties: projectPost
					}
				}
			},
			summary: "Update project data"
		}
	};
	fastify.put("/:project_id", updateProjectSchema, async request => {
		const project = await Projects.updateOne(request.params.project_id, request.body.project);
		return { data: project };
	});

	const projectDeleteSchema = {
		schema: {
			tags: ["projects"],
			summary: "Delete a project",
			params: projectIdParam
		}
	};
	fastify.delete("/:project_id", projectDeleteSchema, async request => {
		const projectIds = request.params.project_id.split(",");
		for (projectId of projectIds) {
			await Projects.destroy(projectId);
		}
		return "OK";
	});

	const projectUsersByProjectIdSchema = {
		schema: {
			tags: ["projects"],
			summary: "Get project users",
			params: projectIdParam,
			response: {
				200: {
					type: "array",
					items: {
						type: "object",
						properties: responseProjectUsers
					}
				}
			}
		}
	};
	fastify.get("/:project_id/project_users", projectUsersByProjectIdSchema, async request => {
		return await Projects.getProjectUsersByProjectId(request.params.project_id);
	});

	const projectTasksByProjectIdSchema = {
		schema: {
			tags: ["projects"],
			summary: "Get project tasks",
			params: projectIdParam,
			response: {
				200: {
					type: "array",
					items: {
						type: "object",
						properties: responseTask
					}
				}
			}
		}
	};
	fastify.get("/:project_id/tasks", projectTasksByProjectIdSchema, async request => {
		return await Projects.getTasksByProjectId(request.params.project_id);
	});
};
