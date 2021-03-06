import fastify from "fastify";
import { IncomingMessage, Server, ServerResponse } from "http";

import { Clients } from "../../../db/clients";
import { ClientBody, ClientParams } from "../../../models/Client";
import { ActiveQuery } from "../../../models/ActiveQuery";
import { responseClient } from "../../../schema/schema";
import { responseProject } from "../../../schema/schema";

const successfulResponse = {
	200: {
		type: "object",
		properties: {
			data: {
				type: "object",
				properties: responseClient,
				required: ["id", "wid", "name"]
			}
		}
	}
};

module.exports = async (fastify: fastify.FastifyInstance<Server, IncomingMessage, ServerResponse>) => {
	const { id, at, ...clientPost } = responseClient;
	const { wid, ...clientPut } = clientPost;
	const clientPostSchema = {
		schema: {
			tags: ["clients"],
			summary: "Create a client",
			body: {
				type: "object",
				properties: {
					client: {
						type: "object",
						properties: clientPost,
						required: ["name", "wid"]
					}
				}
			},
			response: successfulResponse
		}
	};
	fastify.post<unknown, unknown, unknown, ClientBody>("/", clientPostSchema, async request => {
		const client = await Clients.create(request.body.client);
		return { data: client };
	});

	const clientIdParam = {
		type: "object",
		properties: {
			client_id: {
				type: "string",
				description: "client id"
			}
		}
	};
	const clientByIdSchema = {
		schema: {
			tags: ["clients"],
			summary: "Get client details",
			params: clientIdParam,
			response: successfulResponse
		}
	};
	fastify.get<unknown, ClientParams, unknown, unknown>("/:client_id", clientByIdSchema, async request => {
		const client = await Clients.findByID(request.params.client_id);
		return { data: client };
	});

	const clientPuttSchema = {
		schema: {
			tags: ["clients"],
			summary: "Update a client",
			body: {
				type: "object",
				properties: {
					client: {
						type: "object",
						properties: clientPut,
						required: ["name"]
					}
				}
			},
			params: clientIdParam,
			response: successfulResponse
		}
	};
	fastify.put<unknown, ClientParams, unknown, ClientBody>("/:client_id", clientPuttSchema, async request => {
		const client = await Clients.updateOne(request.params.client_id, request.body.client);
		return { data: client };
	});

	const clientDeleteSchema = {
		schema: {
			tags: ["clients"],
			summary: "Delete a client",
			params: clientIdParam
		}
	};
	fastify.delete<unknown, ClientParams, unknown, unknown>("/:client_id", clientDeleteSchema, async request => {
		await Clients.destroy(request.params.client_id);
		return "OK";
	});

	const clientProjectsSchema = {
		schema: {
			tags: ["clients"],
			summary: "Get client projects",
			params: clientIdParam,
			querystring: {
				active: {
					enum: ["true", "false", "both"]
				}
			},
			response: {
				200: {
					type: "array",
					items: {
						type: "object",
						properties: responseProject
					}
				}
			}
		}
	};
	fastify.get<ActiveQuery, ClientParams, unknown, unknown>(
		"/:client_id/projects",
		clientProjectsSchema,
		async request => {
			if (request.query.active === "both") {
				return await Clients.getClientProjects(request.params.client_id);
			}
			return await Clients.getClientProjectsByActive(request.params.client_id, request.query.active);
		}
	);
};
