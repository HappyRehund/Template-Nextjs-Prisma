"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createPost(formData: FormData) {
  if (!formData.has("title") || !formData.has("content")) {
    throw new Error("Title and content are required");
  }

  await prisma.post.create({
    data: {
      title: formData.get("title") as string,
      content: formData.get("content") as string,

    },
  });

  revalidatePath("/posts");
}

export async function editPost(id: string, formData: FormData) {
  await prisma.post.update({
    where: {
      id: id,
    },
    data: {
      title: formData.get("title") as string,
      content: formData.get("content") as string,
    },
  });

  revalidatePath(`/posts/${id}`);
}

export async function deletePost(id: string) {
  await prisma.post.delete({
    where: {
      id,
    },
  });

  revalidatePath("/posts");
}