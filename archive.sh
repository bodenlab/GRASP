
# Add any branches you don't want to archive into the protect array
# Note - this won't delete local repositories
protect=(master dhad-run)


# Loop through all the branches, tag them with archive, delete them from the repository
branches=()
eval "$(git for-each-ref --shell --format='branches+=(%(refname))' refs/heads/)"

for branch in "${branches[@]}"; do
    branchname=${branch##*/}
    if echo ${protect[@]} | grep -q -w $branchname; then 
        echo $branchname "will not be deleted"
    else 
    	    git tag archive/$branchname $branchname
    	    git branch -d $branchname
    	    git push origin :$branchname    
    	fi
done

# Push the tags to the repository
git push --tags
