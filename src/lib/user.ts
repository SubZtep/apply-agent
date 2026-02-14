let profileText: string

export async function getProfileText() {
  if (!profileText) {
    const cvFile = Bun.file(process.env.CV_FILE)
    if (await cvFile.exists()) {
      profileText = await cvFile.text()
    }
  }
  return profileText
}
